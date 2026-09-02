
import asyncio, os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from .db import init_db, refresh_logs
from .models import CARDS
from .service import refresh, trend

load_dotenv()

async def periodic_refresh(app):
    seconds=max(300,int(os.getenv("REFRESH_SECONDS","900")))
    while True:
        for card in CARDS.values():
            await refresh(card, include_seed=False)
        await asyncio.sleep(seconds)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed known public historical observations once; UNIQUE constraint dedupes.
    for card in CARDS.values():
        await refresh(card, include_seed=True)
    task=asyncio.create_task(periodic_refresh(app))
    yield
    task.cancel()

app=FastAPI(title="The Grail Market Data API", version="0.1.0", lifespan=lifespan)
STATIC=Path(__file__).resolve().parents[1]/"static"
app.mount("/static", StaticFiles(directory=STATIC), name="static")

@app.get("/")
def home():
    return FileResponse(STATIC/"index.html")

@app.get("/api/cards/{card_id}/trend")
def get_trend(card_id: str):
    card=CARDS.get(card_id)
    if not card: raise HTTPException(404,"Unknown card")
    return trend(card)

@app.post("/api/cards/{card_id}/refresh")
async def refresh_now(card_id: str):
    card=CARDS.get(card_id)
    if not card: raise HTTPException(404,"Unknown card")
    result=await refresh(card, include_seed=False)
    return {"sources":result,"trend":trend(card)}

@app.get("/api/cards/{card_id}/refresh-log")
def get_refresh_log(card_id: str):
    if card_id not in CARDS: raise HTTPException(404,"Unknown card")
    return refresh_logs(card_id)
