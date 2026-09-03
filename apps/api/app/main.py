import asyncio
import itertools
import json
import os
import time
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .cardgen import palette_for, slugify
from .checklist import BULK_CARDS, search_bulk
from .db import init_db, insert_sale, refresh_logs, sales as sales_rows
from .models import CARDS, COLLECTION, OPPONENT_COLLECTION, OPPONENT_NAME, CardInstance, CardSpec
from .portfolio import breakdown as portfolio_breakdown, discover_movers, performance_series
from .service import refresh, trend
from .valuation import grail_estimate, grail_rating, liquidity_profile, market_commentary

load_dotenv()

# Every card is seeded on startup, but SeedAdapter (app/sources/seed.py) only
# has real data for cards actually looked up — everything else gets an empty
# list back and stays at zero sales, rendering the genuine "insufficient data"
# state instead of a borrowed number. See HANDOFF.md section 6 ("no fake
# precision") and docs/ARCHITECTURE.md section E.

# No source here has a free, ToS-compliant scraping path for arbitrary cards —
# eBay sold data requires an approved Marketplace Insights token (Limited Release),
# PSA APR has no general search API, Heritage prohibits automated scraping, and Card
# Ladder / Sports Card Investor are paid products whose product *is* this data. See
# docs/ARCHITECTURE.md section E. Until real API access exists, a human who actually
# looked up a real sale on one of these sites can log it here instead — same `sales`
# table and schema the adapters write into, just entered by hand and marked
# unverified until someone can audit it.
COMP_SOURCES = [
    "eBay",
    "PSA Auction Prices Realized",
    "Heritage Auctions",
    "Card Ladder",
    "Sports Card Investor",
    "Fanatics Collect",
    "Goldin",
    "Other",
]


async def periodic_refresh(app):
    seconds = max(300, int(os.getenv("REFRESH_SECONDS", "900")))
    while True:
        for card in CARDS.values():
            await refresh(card, include_seed=False)
        await asyncio.sleep(seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    for card in CARDS.values():
        await refresh(card, include_seed=True)
    task = asyncio.create_task(periodic_refresh(app))
    yield
    task.cancel()


class NoCacheStaticFiles(StaticFiles):
    """Cache-Control: no-cache forces revalidation on every request instead of
    trusting a cached copy blindly — cheap here (a 304 via ETag when nothing
    changed). This alone turned out not to be enough in practice (something
    between browser and origin — proxy, preview infra — kept serving a stale
    JS file even past hard-refreshes and full session restarts), which is why
    /assets/{ASSET_VERSION} below exists: a URL that changes on every server
    restart, so a cache keyed on URL can't return stale bytes no matter what
    it does with headers. This header stays as defense in depth."""

    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        response.headers["Cache-Control"] = "no-cache"
        return response


app = FastAPI(title="The Grail Market Data API", version="0.3.0", lifespan=lifespan)
STATIC = Path(__file__).resolve().parents[1] / "static"
UPLOADS = STATIC / "uploads"
app.mount("/static", NoCacheStaticFiles(directory=STATIC), name="static")

# Changes every process start, so /assets/{ASSET_VERSION}/js/... is a brand
# new URL each time the server restarts during development — see
# NoCacheStaticFiles above for why this exists alongside the Cache-Control
# header rather than relying on it alone. JS files import each other with
# relative paths (e.g. "../components/Widgets.js"), which resolve against
# whatever URL the importing module was itself loaded from — so serving the
# *entry* script from a versioned path is enough to version its whole import
# graph, without touching any import statement.
ASSET_VERSION = str(int(time.time()))
app.mount(f"/assets/{ASSET_VERSION}", NoCacheStaticFiles(directory=STATIC), name="static_versioned")


def _render_page(name: str) -> HTMLResponse:
    html = (STATIC / f"{name}.html").read_text()
    html = html.replace("/static/js/", f"/assets/{ASSET_VERSION}/js/")
    html = html.replace("/static/css/", f"/assets/{ASSET_VERSION}/css/")
    return HTMLResponse(html, headers={"Cache-Control": "no-cache"})


PAGES = ["index", "card", "collection", "market", "trade", "grails", "wants", "scan", "alerts", "profile"]


def _card_or_404(card_id: str):
    """Checks the tracked catalog first, then the bulk checklist index
    (app/checklist.py) — the moment a bulk card is actually opened or
    collected, it's promoted into CARDS and behaves like any other tracked
    card from then on (refreshed, eligible for Market/Discover/Grails), same
    as a card entered by hand through POST /api/cards."""
    card = CARDS.get(card_id)
    if card:
        return card
    bulk = BULK_CARDS.get(card_id)
    if bulk:
        CARDS[card_id] = bulk
        return bulk
    raise HTTPException(404, "Unknown card")


def _card_summary(card):
    est = grail_estimate(sales_rows(card.card_id, card.grade))
    rating = grail_rating(card, est)
    return {
        "commentary": market_commentary(card, est),
        "liquidity": liquidity_profile(est),
        "card_id": card.card_id,
        "title": card.title,
        "player": card.player,
        "team": card.team,
        "sport": card.sport,
        "year": card.year,
        "manufacturer": card.manufacturer,
        "product": card.product,
        "set_name": card.set_name,
        "card_number": card.card_number,
        "parallel": card.parallel,
        "serial_number": card.serial_number,
        "print_run": card.print_run,
        "population_psa10": card.population_psa10,
        "population_all_graded": card.population_all_graded,
        "released": card.released,
        "grade": card.grade,
        "rookie": card.rookie,
        "autograph": card.autograph,
        "relic": card.relic,
        "tags": list(card.tags),
        "jersey_number": card.jersey_number,
        "primary_color": card.primary_color,
        "secondary_color": card.secondary_color,
        "estimate": est,
        "rating": rating,
    }


def _instance_summary(inst):
    card = CARDS.get(inst.card_id)
    if not card:
        return None
    return {
        "instance_id": inst.instance_id,
        "status": inst.status,
        "acquired_price": inst.acquired_price,
        "acquired_date": inst.acquired_date,
        "grade": inst.grade,
        "front_image": inst.front_image,
        "back_image": inst.back_image,
        "card": _card_summary(card),
    }


def _instance_or_404(instance_id: str) -> CardInstance:
    for inst in COLLECTION:
        if inst.instance_id == instance_id:
            return inst
    raise HTTPException(404, "Unknown collection instance")


PHOTO_EXTENSION_BY_CONTENT_TYPE = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_PHOTO_BYTES = 15 * 1024 * 1024


@app.post("/api/collection/{instance_id}/photo")
async def upload_instance_photo(instance_id: str, side: str = "front", file: UploadFile = File(...)):
    """Real photo of this specific physical card, per HANDOFF.md section 12's
    CARD_INSTANCE.front_image/back_image. Filename is always
    {instance_id}-{side}, never the uploaded filename, so there's no path-
    traversal surface from what a browser sends. A query-string cache-bust on
    the returned URL exists for the same reason the asset-versioning scheme
    does (see NoCacheStaticFiles/ASSET_VERSION above) — re-uploading a photo
    under the same filename would otherwise risk a browser serving the old one."""
    if side not in ("front", "back"):
        raise HTTPException(422, "side must be 'front' or 'back'")
    inst = _instance_or_404(instance_id)
    ext = PHOTO_EXTENSION_BY_CONTENT_TYPE.get(file.content_type)
    if not ext:
        raise HTTPException(422, "Only JPEG, PNG, or WebP images are accepted")
    body = await file.read()
    if len(body) > MAX_PHOTO_BYTES:
        raise HTTPException(422, "Image is too large (max 15MB)")
    UPLOADS.mkdir(parents=True, exist_ok=True)
    for stale in UPLOADS.glob(f"{instance_id}-{side}.*"):
        stale.unlink(missing_ok=True)
    (UPLOADS / f"{instance_id}-{side}.{ext}").write_bytes(body)
    url = f"/static/uploads/{instance_id}-{side}.{ext}?t={int(time.time())}"
    if side == "front":
        inst.front_image = url
    else:
        inst.back_image = url
    return _instance_summary(inst)


@app.delete("/api/collection/{instance_id}/photo")
def delete_instance_photo(instance_id: str, side: str = "front"):
    if side not in ("front", "back"):
        raise HTTPException(422, "side must be 'front' or 'back'")
    inst = _instance_or_404(instance_id)
    for stale in UPLOADS.glob(f"{instance_id}-{side}.*"):
        stale.unlink(missing_ok=True)
    if side == "front":
        inst.front_image = None
    else:
        inst.back_image = None
    return _instance_summary(inst)


def _owned_card_ids():
    return {inst.card_id for inst in COLLECTION}


for _page in PAGES:
    def _make_handler(name):
        def _handler():
            return _render_page(name)
        return _handler
    app.get(f"/{_page}.html" if _page != "index" else "/")(_make_handler(_page))


@app.get("/api/cards")
def list_cards():
    return [_card_summary(c) for c in CARDS.values()]


@app.get("/api/cards/{card_id}")
def get_card(card_id: str):
    return _card_summary(_card_or_404(card_id))


class CreateCardRequest(BaseModel):
    player: str
    sport: str
    year: str
    manufacturer: str
    product: str
    set_name: str
    card_number: str = "—"
    parallel: Optional[str] = None
    serial_number: Optional[str] = None
    print_run: Optional[int] = None
    team: Optional[str] = None
    grade: str = "Raw"
    rookie: bool = False
    autograph: bool = False
    relic: bool = False


@app.post("/api/cards")
def create_card(body: CreateCardRequest):
    """There's no free bulk card-checklist database covering "any card since
    the 1950s" to wire in here — same category of gap as real-time market data
    (docs/ARCHITECTURE.md section E). The honest answer isn't to fake one; it's
    the same pattern that solved that gap: a human who actually knows the card
    enters its real identity, same as POST /api/cards/{id}/comps for a real
    sale. Once added it's a first-class CARD_MASTER — Grail Estimate/Rating,
    generated card art, fully searchable — not a second-tier record."""
    required = {"player": body.player, "sport": body.sport, "year": body.year,
                "manufacturer": body.manufacturer, "product": body.product, "set_name": body.set_name}
    for field, value in required.items():
        if not value.strip():
            raise HTTPException(422, f"{field} is required")

    card_id = slugify(body.player, body.year, body.set_name, body.card_number, body.serial_number or "")
    if card_id in CARDS:
        suffix = 2
        while f"{card_id}-{suffix}" in CARDS:
            suffix += 1
        card_id = f"{card_id}-{suffix}"

    primary, secondary = palette_for(body.player, body.set_name)
    title_bits = [body.year.strip(), body.manufacturer.strip(), body.product.strip()]
    if body.card_number.strip() and body.card_number.strip() != "—":
        title_bits.append(f"#{body.card_number.strip()}")
    title = f"{body.player.strip()} " + " ".join(b for b in title_bits if b)

    card = CardSpec(
        card_id=card_id,
        query=f'"{body.year}" "{body.manufacturer}" "{body.product}" "{body.player}"',
        grade=body.grade.strip() or "Raw",
        title=title,
        sport=body.sport.strip(),
        year=body.year.strip(),
        manufacturer=body.manufacturer.strip(),
        product=body.product.strip(),
        set_name=body.set_name.strip(),
        player=body.player.strip(),
        card_number=body.card_number.strip() or "—",
        team=(body.team or "").strip() or None,
        parallel=(body.parallel or "").strip() or None,
        serial_number=(body.serial_number or "").strip() or None,
        print_run=body.print_run,
        rookie=body.rookie,
        autograph=body.autograph,
        relic=body.relic,
        primary_color=primary,
        secondary_color=secondary,
        significance_score=50,
        significance_source="editorial",
        tags=("User-Added",),
    )
    CARDS[card_id] = card
    return _card_summary(card)


@app.get("/api/checklist/search")
def checklist_search(q: str, limit: int = 25):
    """Search the bulk checklist (app/checklist.py) — currently 41,823 real
    Topps Baseball cards, 1952-2016. Excludes anything already hand-curated in
    CARDS so a researched vintage card (e.g. the 1952 Mantle) doesn't also
    show up as an unrated duplicate here. Results are real identities with no
    sales yet, same as any freshly-added card — see "Card catalog scope"."""
    if not q.strip():
        return []
    existing = {(c.player.lower(), c.year, c.manufacturer.lower(), c.card_number) for c in CARDS.values()}
    limit = max(1, min(limit, 100))
    return [_card_summary(c) for c in search_bulk(q, limit=limit, exclude=existing)]


@app.get("/api/cards/{card_id}/trend")
def get_trend(card_id: str, grade: Optional[str] = None):
    card = _card_or_404(card_id)
    return trend(card, grade)


@app.post("/api/cards/{card_id}/refresh")
async def refresh_now(card_id: str):
    card = _card_or_404(card_id)
    result = await refresh(card, include_seed=False)
    return {"sources": result, "trend": trend(card)}


@app.get("/api/cards/{card_id}/refresh-log")
def get_refresh_log(card_id: str):
    _card_or_404(card_id)
    return refresh_logs(card_id)


@app.get("/api/comp-sources")
def comp_sources():
    return COMP_SOURCES


class AddCompRequest(BaseModel):
    sold_at: str  # YYYY-MM-DD
    price: float
    venue: str
    grade: Optional[str] = None
    source_url: Optional[str] = None


@app.post("/api/cards/{card_id}/comps")
def add_comp(card_id: str, body: AddCompRequest):
    """Manual comp entry — see docs/ARCHITECTURE.md section E on why this exists
    instead of live scrapers for eBay/PSA/Heritage/Card Ladder/Sports Card
    Investor. Writes into the same `sales` table and schema the source adapters
    use, so it immediately factors into this card's Grail Estimate/Rating and
    shows up on the ticker like any other point — just rendered as unverified
    (gray dot, "Unverified" in the sales table) until someone can audit it,
    same as any other unverified observation."""
    card = _card_or_404(card_id)
    try:
        sold_date = date.fromisoformat(body.sold_at)
    except ValueError:
        raise HTTPException(422, "sold_at must be an ISO date (YYYY-MM-DD)")
    if sold_date > date.today():
        raise HTTPException(422, "sold_at cannot be in the future")
    if body.price <= 0:
        raise HTTPException(422, "price must be positive")
    if not body.venue or not body.venue.strip():
        raise HTTPException(422, "venue is required")

    grade = (body.grade or card.grade).strip()
    inserted = insert_sale({
        "card_id": card.card_id,
        "grade": grade,
        "sold_at": body.sold_at,
        "price": body.price,
        "venue": body.venue.strip(),
        "source_url": (body.source_url or "").strip() or None,
        "verified": False,
    })
    return {
        "inserted": bool(inserted),
        "duplicate": not inserted,
        "trend": trend(card, grade),
        "card": _card_summary(card),
    }


def _seed_demo_collection():
    """Loads app/data/demo_collection_seed.json (250 real cards — 34 chosen
    for checklist.py's SIGNIFICANCE_OVERRIDES, 216 sampled proportionally
    across all 8 sports in the bulk registry) into COLLECTION at import time,
    before _next_instance_num below is derived from len(COLLECTION) — so the
    instance-id counter and this seed never collide. Runs once per process
    start; COLLECTION is in-memory only, same as every other demo/seed state
    in this file, so this keeps the larger sample from vanishing on restart
    without hardcoding 250 CardInstance literals into models.py."""
    seed_path = Path(__file__).resolve().parent / "data" / "demo_collection_seed.json"
    if not seed_path.exists():
        return
    rows = json.loads(seed_path.read_text())
    existing_ids = {inst.card_id for inst in COLLECTION}
    for i, row in enumerate(rows):
        if row["card_id"] in existing_ids:
            continue
        try:
            card = _card_or_404(row["card_id"])
        except HTTPException:
            continue  # a seed row referencing a card_id that no longer resolves — skip, don't crash startup
        COLLECTION.append(
            CardInstance(
                instance_id=f"seed-{i + 1}",
                card_id=card.card_id,
                grade=row["grade"],
                acquired_price=row["acquired_price"],
                acquired_date=row["acquired_date"],
                status=row["status"],
            )
        )


_seed_demo_collection()

_next_instance_num = itertools.count(len(COLLECTION) + 1)


class AddInstanceRequest(BaseModel):
    card_id: str
    grade: Optional[str] = None
    acquired_price: float = 0.0
    status: str = "PC"


@app.get("/api/collection")
def get_collection():
    return [s for inst in COLLECTION if (s := _instance_summary(inst))]


@app.post("/api/collection")
def add_to_collection(body: AddInstanceRequest):
    """Scan+Add's real endpoint: identify (client-side, from the catalog in this
    demo) -> create a CARD_INSTANCE -> it's immediately valued and rated on
    Collection/Home like any other card. In-memory only — see docs/ARCHITECTURE.md
    Milestone 2 for the real persistence swap-in."""
    card = _card_or_404(body.card_id)
    inst = CardInstance(
        instance_id=f"inst-{next(_next_instance_num)}",
        card_id=card.card_id,
        grade=body.grade or card.grade,
        acquired_price=body.acquired_price,
        acquired_date=date.today().isoformat(),
        status=body.status,
    )
    COLLECTION.append(inst)
    return _instance_summary(inst)


@app.get("/api/collection/summary")
def get_collection_summary():
    items = get_collection()
    estimates = [i["card"]["estimate"]["estimate"] for i in items if i["card"]["estimate"]["estimate"]]
    grail_count = sum(1 for i in items if i["card"]["rating"]["band"])
    cost_basis = sum(i["acquired_price"] for i in items)
    return {
        "card_count": len(items),
        "total_estimated_value": round(sum(estimates), 2) if estimates else None,
        "priced_card_count": len(estimates),
        "cost_basis": round(cost_basis, 2),
        "grail_count": grail_count,
        "status_breakdown": {
            status: sum(1 for i in items if i["status"] == status)
            for status in sorted({i["status"] for i in items})
        },
    }


@app.get("/api/collection/performance")
def get_collection_performance():
    """Reconstructed total portfolio value over time — the Robinhood/Coinbase-
    style portfolio graph. See docs/POSITIONING.md and app/portfolio.py: this
    replays the same grail_estimate() every card page uses at each real sale
    date, it doesn't fabricate a smooth trend line."""
    return performance_series(COLLECTION, CARDS)


@app.get("/api/collection/breakdown")
def get_collection_breakdown(by: str = "sport"):
    if by not in ("sport", "player"):
        raise HTTPException(422, "by must be 'sport' or 'player'")
    return portfolio_breakdown(get_collection(), by)


@app.get("/api/discover")
def discover():
    """Personalized market movers — real momentum, ranked and reasoned against
    what's already owned. See app/portfolio.py's discover_movers()."""
    summaries = [_card_summary(c) for c in CARDS.values()]
    return discover_movers(COLLECTION, summaries)


@app.get("/api/market")
def market_overview():
    """Discovery surface: every CARD_MASTER with its current estimate/rating,
    ranked by absolute momentum so real movers surface first. See
    docs/ARCHITECTURE.md section B (Market page)."""
    cards = [_card_summary(c) for c in CARDS.values()]
    cards.sort(key=lambda c: abs(c["estimate"].get("momentum_pct") or 0), reverse=True)
    return cards


@app.get("/api/grails")
def list_grails():
    """CARD_MASTERs currently carrying a G badge — see valuation.grail_rating()
    for the composite-vs-editorial-override distinction."""
    return [s for c in CARDS.values() if (s := _card_summary(c))["rating"]["band"]]


@app.get("/api/suggested-pickups")
def suggested_pickups():
    """Rule-based recommendation over the catalog: cards the demo user does not
    own, reasoned against what they do own. A real implementation would widen
    this to the full catalog + collector graph (docs/ARCHITECTURE.md, Milestone 3
    Wants/Trade Box) — the reasoning shape doesn't change, only the candidate pool."""
    owned_ids = _owned_card_ids()
    owned_cards = [CARDS[cid] for cid in owned_ids if cid in CARDS]
    out = []
    for card in CARDS.values():
        if card.card_id in owned_ids:
            continue
        reason = None
        same_player = [c for c in owned_cards if c.player == card.player]
        same_release = [c for c in owned_cards if c.manufacturer == card.manufacturer and c.product == card.product]
        same_sport = [c for c in owned_cards if c.sport == card.sport]
        if same_player:
            reason = f"You already collect {card.player} — a strong companion piece."
        elif same_release:
            reason = f"You own other {card.manufacturer} {card.product} cards — same release."
        elif same_sport:
            reason = f"You collect {card.sport.lower()} cards and don't have this one yet."
        else:
            reason = "Notable card not yet in your collection."
        summary = _card_summary(card)
        out.append({"reason": reason, "card": summary})
    return out


@app.get("/api/trade/demo")
def trade_demo():
    """A single illustrative Trade Table pairing: the demo user's tradeable
    instances vs. a sample second collector's. Not a real matched trade — see
    docs/ARCHITECTURE.md section I. Buy/Offer/Trade settlement is Phase 4."""
    you = [s for inst in COLLECTION if (s := _instance_summary(inst))]
    them = [s for inst in OPPONENT_COLLECTION if (s := _instance_summary(inst))]
    return {"you": you, "them": them, "opponent_name": OPPONENT_NAME}
