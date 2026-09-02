# apps/api — The Grail service

FastAPI service that serves both the market-data API and the Milestone 1 frontend
(Collection Home + Card Market Terminal) as static files, on one process/port.

Extended from `handoff/market_engine/grail_market_live/` — see
[`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) for what changed and why.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000`.

## Layout

- `app/models.py` — CARD_MASTER catalog (`CARDS`) and the demo user's owned copies
  (`COLLECTION`, CARD_INSTANCE). Only `mj-scoring-kings-5` ships with seeded market
  history; the rest deliberately start with zero sales.
- `app/db.py` — SQLite transaction store (`sales`, `refresh_log`), unchanged from the
  scaffold.
- `app/service.py` — source-adapter orchestration (`refresh`) and rollup (`trend`),
  unchanged from the scaffold.
- `app/sources/` — adapter pattern (seed / eBay / PSA / Fanatics), unchanged from the
  scaffold. `ENABLE_FANATICS_PUBLIC` defaults to `false` in `.env.example` so local dev
  doesn't make outbound calls; flip it on deliberately.
- `app/valuation.py` — new. `grail_estimate()` and `grail_rating()`: the only place
  transactions become an estimate or a G rating. Never fabricates a number when there
  are no sales.
- `static/` — the frontend: plain HTML + CSS + native ES modules, no build step (see
  "Why no framework" below).

## API

```
GET  /api/cards                    CARD_MASTER catalog + current estimate/rating
GET  /api/cards/{id}                one card
GET  /api/cards/{id}/trend          transaction-level sales + rollup metrics
POST /api/cards/{id}/refresh        run source adapters now
GET  /api/cards/{id}/refresh-log    adapter run history
GET  /api/collection                demo CARD_INSTANCE list, joined to CARD_MASTER
GET  /api/collection/summary        aggregate value / Grail count / status breakdown
```

## Why no framework

`handoff/HANDOFF.md` recommends Next.js + TypeScript for production but says the
recommendation isn't binding as long as product behavior is preserved. This was built
on a machine without Node/npm, so the frontend is dependency-free ES modules instead —
runnable with nothing but a browser and this API. Component boundaries in
`static/js/components/` are drawn to map 1:1 onto future React components if/when the
project moves to Next.js.
