import asyncio
import itertools
import os
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .db import init_db, refresh_logs, sales as sales_rows
from .models import CARDS, COLLECTION, OPPONENT_COLLECTION, OPPONENT_NAME, CardInstance
from .service import refresh, trend
from .valuation import grail_estimate, grail_rating

load_dotenv()

# Only cards with a real reference dataset get seeded on startup — every other
# CARD_MASTER intentionally starts with zero sales so its estimate/rating render the
# genuine "insufficient data" states instead of borrowed numbers. See HANDOFF.md
# section 6 ("no fake precision") and docs/ARCHITECTURE.md section E.
SEEDED_CARD_IDS = {"mj-scoring-kings-5"}


async def periodic_refresh(app):
    seconds = max(300, int(os.getenv("REFRESH_SECONDS", "900")))
    while True:
        for card in CARDS.values():
            if card.card_id in SEEDED_CARD_IDS:
                await refresh(card, include_seed=False)
        await asyncio.sleep(seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    for card in CARDS.values():
        if card.card_id in SEEDED_CARD_IDS:
            await refresh(card, include_seed=True)
    task = asyncio.create_task(periodic_refresh(app))
    yield
    task.cancel()


app = FastAPI(title="The Grail Market Data API", version="0.3.0", lifespan=lifespan)
STATIC = Path(__file__).resolve().parents[1] / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")

PAGES = ["index", "card", "collection", "market", "trade", "grails", "wants", "scan", "alerts", "profile"]


def _card_or_404(card_id: str):
    card = CARDS.get(card_id)
    if not card:
        raise HTTPException(404, "Unknown card")
    return card


def _card_summary(card):
    est = grail_estimate(sales_rows(card.card_id, card.grade))
    rating = grail_rating(card, est)
    return {
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
        "front_image": card.front_image,
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
        "card": _card_summary(card),
    }


def _owned_card_ids():
    return {inst.card_id for inst in COLLECTION}


for _page in PAGES:
    def _make_handler(name):
        def _handler():
            return FileResponse(STATIC / f"{name}.html")
        return _handler
    app.get(f"/{_page}.html" if _page != "index" else "/")(_make_handler(_page))


@app.get("/api/cards")
def list_cards():
    return [_card_summary(c) for c in CARDS.values()]


@app.get("/api/cards/{card_id}")
def get_card(card_id: str):
    return _card_summary(_card_or_404(card_id))


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
