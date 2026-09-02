import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .db import init_db, refresh_logs, sales as sales_rows
from .models import CARDS, COLLECTION
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


app = FastAPI(title="The Grail Market Data API", version="0.2.0", lifespan=lifespan)
STATIC = Path(__file__).resolve().parents[1] / "static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")


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
        "sport": card.sport,
        "year": card.year,
        "manufacturer": card.manufacturer,
        "product": card.product,
        "set_name": card.set_name,
        "parallel": card.parallel,
        "serial_number": card.serial_number,
        "grade": card.grade,
        "rookie": card.rookie,
        "autograph": card.autograph,
        "relic": card.relic,
        "front_image": card.front_image,
        "estimate": est,
        "rating": rating,
    }


@app.get("/")
def home():
    return FileResponse(STATIC / "index.html")


@app.get("/card.html")
def card_page():
    return FileResponse(STATIC / "card.html")


@app.get("/api/cards")
def list_cards():
    return [_card_summary(c) for c in CARDS.values()]


@app.get("/api/cards/{card_id}")
def get_card(card_id: str):
    return _card_summary(_card_or_404(card_id))


@app.get("/api/cards/{card_id}/trend")
def get_trend(card_id: str):
    card = _card_or_404(card_id)
    return trend(card)


@app.post("/api/cards/{card_id}/refresh")
async def refresh_now(card_id: str):
    card = _card_or_404(card_id)
    result = await refresh(card, include_seed=False)
    return {"sources": result, "trend": trend(card)}


@app.get("/api/cards/{card_id}/refresh-log")
def get_refresh_log(card_id: str):
    _card_or_404(card_id)
    return refresh_logs(card_id)


@app.get("/api/collection")
def get_collection():
    out = []
    for inst in COLLECTION:
        card = CARDS.get(inst.card_id)
        if not card:
            continue
        summary = _card_summary(card)
        out.append({
            "instance_id": inst.instance_id,
            "status": inst.status,
            "acquired_price": inst.acquired_price,
            "acquired_date": inst.acquired_date,
            "grade": inst.grade,
            "card": summary,
        })
    return out


@app.get("/api/collection/summary")
def get_collection_summary():
    items = get_collection()
    estimates = [i["card"]["estimate"]["estimate"] for i in items if i["card"]["estimate"]["estimate"]]
    grail_count = sum(1 for i in items if i["card"]["rating"]["band"] in ("GRAIL", "ELITE"))
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
