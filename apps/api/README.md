# apps/api — The Grail service

FastAPI service that serves both the market-data API and the full frontend (Home,
Card Market Terminal, Collection, Market, Trade Table, Scan+Add, Grails, Wants,
Alerts, Profile) as static files, on one process/port.

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

- `app/models.py` — CARD_MASTER catalog (`CARDS`, 5 demo cards), the demo user's owned
  copies (`COLLECTION`), and a sample second collector's inventory (`OPPONENT_COLLECTION`,
  Trade Table demo only). Only `mj-scoring-kings-5` ships with seeded market history;
  the rest deliberately start with zero sales.
- `app/db.py` — SQLite transaction store (`sales`, `refresh_log`); fixed a schema bug
  from the scaffold (see `docs/ARCHITECTURE.md` section E).
- `app/service.py` — source-adapter orchestration (`refresh`) and rollup (`trend`,
  now grade-aware) built on the scaffold.
- `app/sources/` — adapter pattern (seed / eBay / PSA / Fanatics), unchanged from the
  scaffold. `ENABLE_FANATICS_PUBLIC` defaults to `false` in `.env.example` so local dev
  doesn't make outbound calls; flip it on deliberately.
- `app/valuation.py` — `grail_estimate()` and `grail_rating()`: the only place
  transactions become an estimate or a G rating, including the spec's editorial-override
  path for historically significant cards with too little market data to score on the
  composite alone (`docs/ARCHITECTURE.md` section J). Never fabricates a number when
  there are no sales.
- `static/` — the frontend: plain HTML + CSS + native ES modules, no build step (see
  "Why no framework" below). `js/components/CardPanel.js` is the shared card
  hero+estimate+ticker used by both Home's featured spotlight and the standalone Card
  Market Terminal.

## API

```
GET  /api/cards                    CARD_MASTER catalog + current estimate/rating
GET  /api/cards/{id}                one card
GET  /api/cards/{id}/trend          transaction-level sales + rollup metrics
                                    (?grade= to inspect a different grade tab)
POST /api/cards/{id}/refresh        run source adapters now
GET  /api/cards/{id}/refresh-log    adapter run history
GET  /api/collection                demo CARD_INSTANCE list, joined to CARD_MASTER
POST /api/collection                add an instance (Scan+Add's real endpoint;
                                    in-memory only, resets on restart)
GET  /api/collection/summary        aggregate value / Grail count / status breakdown
GET  /api/market                    full catalog, ranked by real momentum
GET  /api/grails                    catalog cards currently carrying a G badge
GET  /api/suggested-pickups         rule-based recommendations from the owned/unowned split
GET  /api/trade/demo                Trade Table demo pairing (you vs. a sample opponent)
```

## Why no framework

`handoff/HANDOFF.md` recommends Next.js + TypeScript for production but says the
recommendation isn't binding as long as product behavior is preserved. This was built
on a machine without Node/npm, so the frontend is dependency-free ES modules instead —
runnable with nothing but a browser and this API. Component boundaries in
`static/js/components/` are drawn to map 1:1 onto future React components if/when the
project moves to Next.js.
