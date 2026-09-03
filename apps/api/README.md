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

- `app/models.py` — CARD_MASTER catalog (`CARDS`, 8 demo cards across basketball/
  soccer/baseball), the demo user's owned copies (`COLLECTION`), and a sample second
  collector's inventory (`OPPONENT_COLLECTION`, Trade Table demo only). Each card
  carries `primary_color`/`secondary_color`/`jersey_number` — inputs to the generated
  card art, not photo metadata (see "Card art" below).
- `app/db.py` — SQLite transaction store (`sales`, `refresh_log`); fixed a schema bug
  from the scaffold (see `docs/ARCHITECTURE.md` section E).
- `app/service.py` — source-adapter orchestration (`refresh`) and rollup (`trend`,
  now grade-aware) built on the scaffold.
- `app/sources/` — adapter pattern (seed / eBay / PSA / Fanatics), unchanged from the
  scaffold. `ENABLE_FANATICS_PUBLIC` defaults to `false` in `.env.example` so local dev
  doesn't make outbound calls; flip it on deliberately. `seed.py`'s `SEED_BY_CARD` now
  holds real completed-sale data for all 8 catalog cards, looked up by hand through
  PSA's Auction Prices Realized (see "Market data provenance" below) rather than
  invented — replaces the single-card placeholder dataset from earlier milestones.
- `app/valuation.py` — `grail_estimate()` and `grail_rating()`: the only place
  transactions become an estimate or a G rating, including the spec's editorial-override
  path for historically significant cards with too little market data to score on the
  composite alone (`docs/ARCHITECTURE.md` section J). Never fabricates a number when
  there are no sales. `grail_estimate()` takes an optional `as_of` so it can be replayed
  at a past date — see `app/portfolio.py`.
- `app/portfolio.py` — the portfolio-level lens on top of the same per-card estimate:
  `performance_series()` reconstructs total portfolio value over time by replaying
  `grail_estimate()` at each real sale date (not a fabricated trend line), and
  `breakdown()` groups the collection by sport or by player. See `docs/POSITIONING.md`
  — this is what makes Home read like a brokerage portfolio view, not just a card list.
- `static/` — the frontend: plain HTML + CSS + native ES modules, no build step (see
  "Why no framework" below). `js/components/CardPanel.js` is the shared card
  hero+estimate+ticker used by the standalone Card Market Terminal.
  `js/components/PortfolioChart.js` and `BreakdownWidget.js` render the portfolio graph
  and sport/player breakdown on Home. `js/components/CardArt.js` generates every card
  face (see "Card art" below) and is used everywhere a card renders — tiles, thumbnails,
  hero.

## Card art

Every card face is generated SVG (`js/components/CardArt.js`), not a photo — real
card-manufacturer photography is copyrighted, and this repo has no license for it
(the handoff itself flags this: "use properly licensed/authorized imagery in
production," `HANDOFF.md` §14/15). Generation is deterministic from
`primary_color`/`secondary_color`/`jersey_number`/`player`/`team`, so it's also what
makes the catalog look like one coherent product instead of mismatched stock photos.
A production build swaps in licensed photography behind this same component — nothing
downstream needs to change.

## API

```
GET  /api/cards                    CARD_MASTER catalog + current estimate/rating
GET  /api/cards/{id}                one card
GET  /api/cards/{id}/trend          transaction-level sales + rollup metrics
                                    (?grade= to inspect a different grade tab)
POST /api/cards/{id}/refresh        run source adapters now
GET  /api/cards/{id}/refresh-log    adapter run history
GET  /api/comp-sources              source list for the manual "Add Comp" form
POST /api/cards/{id}/comps          log a manually-looked-up real sale (unverified
                                    until audited; see "Market data provenance")
GET  /api/collection                demo CARD_INSTANCE list, joined to CARD_MASTER
POST /api/collection                add an instance (Scan+Add's real endpoint;
                                    in-memory only, resets on restart)
GET  /api/collection/summary        aggregate value / Grail count / status breakdown
GET  /api/collection/performance    portfolio value over time, reconstructed from
                                    real sales (the Home portfolio graph)
GET  /api/collection/breakdown      ?by=sport|player — portfolio grouped by that lens
GET  /api/market                    full catalog, ranked by real momentum
GET  /api/grails                    catalog cards currently carrying a G badge
GET  /api/suggested-pickups         rule-based recommendations from the owned/unowned split
GET  /api/trade/demo                Trade Table demo pairing (you vs. a sample opponent)
```

## Market data provenance

None of eBay/PSA/Heritage/Card Ladder/Sports Card Investor have a free,
ToS-compliant automated path to completed-sale data — see
`docs/ARCHITECTURE.md` section E. Two real (not automated-scraper) paths exist
instead:

1. **`POST /api/cards/{id}/comps`** — anyone can log a real sale they looked up
   themselves. Saves as unverified (gray point on the ticker) until audited.
2. **`app/sources/seed.py`'s `SEED_BY_CARD`** — the current dataset for all 8
   catalog cards, looked up by hand through PSA's Auction Prices Realized
   (a licensed product that itself aggregates eBay/Fanatics Collect/Goldin
   Auctions/etc.), via an authenticated PSA account. Each card's `source_url`
   points at the PSA page it came from. Saves as verified — PSA APR is a
   licensed data business, not a self-report, so it gets the stronger
   provenance tier. An attempted direct eBay lookup (even through a real,
   logged-in, human-driven browser session) was blocked by eBay's own bot
   detection with a CAPTCHA wall before any data could be read — confirming
   there's no automated path there regardless of login state.

Both paths write into the exact same `sales` table and schema — there's no
structural difference between "real data I looked up" and "real data an
adapter fetched," only the `verified` flag and how it got there.

## Why no framework

`handoff/HANDOFF.md` recommends Next.js + TypeScript for production but says the
recommendation isn't binding as long as product behavior is preserved. This was built
on a machine without Node/npm, so the frontend is dependency-free ES modules instead —
runnable with nothing but a browser and this API. Component boundaries in
`static/js/components/` are drawn to map 1:1 onto future React components if/when the
project moves to Next.js.
