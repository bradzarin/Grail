# The Grail — Architecture Proposal

This is the response requested by `handoff/CLAUDE_START_PROMPT.md` before implementation
began: proposed repo structure, component map, data model/API map, first three milestones,
issues found in the existing scaffold, and the marketplace extension points the identity/
portfolio/intelligence substrate needs to leave open.

## Status update — depth pass beyond Milestone 1's original scope

The first pass shipped literally Milestone 1 (Collection + Card Terminal only, per
`handoff/CLAUDE_START_PROMPT.md`'s "do not begin with commerce"). Reviewing it against
the handoff's own reference images (`assets/full_dashboard_reference.png`,
`assets/card_detail_market_trend_reference.png`, `assets/trade_table_mobile_reference.png`)
showed it was too shallow relative to what those references specify — a sidebar-shell
app with Home/Market/Trade/Scan/Wants/Alerts/Profile, grade tabs, population stats, a
Trade Table, etc. This pass rebuilds the frontend to match that reference depth and
extends the API accordingly (`/api/market`, `/api/grails`, `/api/suggested-pickups`,
`/api/trade/demo`, `POST /api/collection`), while keeping the build-order discipline
from HANDOFF.md §17: every new surface is either Collection/Intelligence (real, wired to
`valuation.py`) or an explicitly-labeled Marketplace *preview* (Buy/Offer/Trade buttons
are present and clickable, matching the reference UI, but do not settle anything —
settlement is still Phase 4). See `apps/api/README.md` for the full endpoint list and
which pieces are real vs. demo state.

## Status update — Home restructured as a hub; generated card art

User feedback on the depth pass above: Home was still too dominated by one featured
card's Market Trends terminal (essentially a second Card Market Terminal), and the
card imagery (the founder's own reference photos, reused across every tile) looked
inconsistent as a demo catalog. Two changes:

1. **Home is now a hub, not a drill-down.** The single-card spotlight is gone.
   Home = hero brand band → collection stat row → **Best Performing Cards** (new —
   ranked by real unrealized gain, `current estimate − acquired price`, computed
   per instance; cards without market data are excluded rather than shown with a
   fabricated 0%) → a Collection preview grid → Grails / Suggested Pickups. The
   single-card terminal view lives only on `card.html`, reached by clicking through.
2. **Card art is now generated, not photographed** — see `apps/api/README.md`
   ("Card art" section) for the full reasoning. In short: real card photography is
   copyrighted, this repo has no license for it, and the handoff's own text agrees
   ("use properly licensed/authorized imagery in production"). The catalog also grew
   from 5 to 8 cards (added Messi, Ohtani, Zidane) so Best Performing Cards, Grails
   and Suggested Pickups all have enough real (unpadded) content to not look sparse.

## Status update — real market data for all 8 cards, sourced by hand

User request: use eBay/PSA/Heritage/Card Ladder/Sports Card Investor as sources
for market trend data, "completely accurate from the data available." None of
those five have a free, ToS-compliant automated path to completed-sale data —
see section E below for the full breakdown per source. Two things followed
from that:

1. **`POST /api/cards/{id}/comps`** — a human who actually looked up a real
   sale can log it. Real data, honestly marked unverified until audited.
2. **A live one-off eBay lookup was attempted and blocked.** Per explicit
   request, tried fetching eBay's own public "sold items" search — first
   through the sandboxed preview browser, then through the user's real,
   logged-in Chrome (via Claude in Chrome). Both were stopped by eBay's own
   bot-detection CAPTCHA wall before any page content could be read, even
   with a real logged-in session. Did not attempt to solve/bypass it — that's
   a hard line regardless of context. This is now confirmed by direct
   attempt, not just inferred from eBay's terms.
3. **PSA's Auction Prices Realized worked.** It's a licensed product PSA
   sells (an authenticated account, no bot-detection wall), and it itself
   aggregates real completed sales from eBay, Fanatics Collect, and Goldin
   Auctions. Looked up real sales history by hand for all 8 catalog cards and
   replaced `app/sources/seed.py`'s single-card placeholder dataset with it —
   `SEED_BY_CARD`, keyed by card id, each entry carrying the exact
   (date, price, venue) rows PSA displayed and a `source_url` back to the PSA
   page for re-auditing. Marked `verified: True` — PSA APR is licensed,
   aggregated, dated data, not a self-report, so it earns the stronger
   provenance tier `POST /api/cards/{id}/comps` entries don't get by default.

Net effect: every catalog card now has real market history instead of just
`mj-scoring-kings-5`. Two data-quality findings surfaced during lookup, noted
in `seed.py` rather than silently corrected: the Shaq insert's real
PSA-cataloged set name is "Ultra Power In The Key," not "Beam Team" (a
nickname carried over from the handoff materials), and the Bellingham
autograph's real manufacturer is Topps, not Panini (`models.py` left as-is —
this update stayed scoped to market data, not catalog corrections).

## Environment note — stack deviation

`HANDOFF.md` §20 recommends Next.js + TypeScript for the frontend and says the
recommendation is not binding as long as product behavior is preserved. This machine has
no Node/npm toolchain available (Python 3 + pip only), so Milestone 1 is built as a
dependency-free **vanilla ES-module frontend** (native browser `<script type="module">`,
no bundler) served as static files by the same FastAPI process that serves the API. This
keeps the app runnable and testable end-to-end in this environment. Component boundaries
below are drawn so each maps cleanly onto a future React/Next.js component if the project
migrates once Node is available — nothing here is a dead end.

## A. Proposed repo structure

```
Grail/
├── README.md
├── docs/
│   └── ARCHITECTURE.md          — this document
├── handoff/                     — founder-supplied source materials, unmodified
│   ├── HANDOFF.md
│   ├── MARKETPLACE_TRADE_AUCTION_SPEC.md
│   ├── CLAUDE_START_PROMPT.md
│   ├── FILE_MANIFEST.txt
│   ├── assets/
│   ├── market_engine/
│   ├── marketplace_code/
│   ├── pitch/
│   └── prototypes/
└── apps/
    └── api/                     — FastAPI service: API + Milestone 1 static frontend
        ├── app/
        │   ├── main.py          — routes, static mount, app lifespan
        │   ├── db.py            — SQLite access (sales, refresh log)
        │   ├── models.py        — CARD_MASTER catalog + demo COLLECTION (card instances)
        │   ├── valuation.py     — Grail Estimate + Grail Rating computation
        │   ├── service.py       — refresh orchestration, trend aggregation
        │   └── sources/         — source adapter pattern (seed, eBay, PSA, Fanatics)
        ├── static/              — Milestone 1 frontend (served at "/")
        │   ├── index.html       — Collection Home
        │   ├── card.html        — Card Market Terminal
        │   ├── css/app.css
        │   ├── js/
        │   │   ├── api.js               — typed fetch client for the API
        │   │   ├── components/          — one file per reusable UI unit
        │   │   └── pages/                — page-level composition + data loading
        │   └── assets/cards/    — local card imagery (never remote URLs)
        ├── requirements.txt
        ├── .env.example
        └── README.md
```

`apps/` anticipates a sibling `apps/web/` (Next.js) later without moving the API. The API
package is deliberately import-light (`fastapi`, `uvicorn`, `python-dotenv`, `httpx`) so it
stays easy to run anywhere.

## B. Component map (Milestone 1)

Each JS module below is a self-contained render function `(el, props) => void` — the same
shape a React functional component would take, so porting later is mechanical.

- `Nav` — primary nav (HOME | MARKET | COLLECTION), active-route highlighting.
- `CardImage` — front/back image with fallback: on load error, swaps to a monogram/initial
  placeholder rather than a broken image, per HANDOFF §14.
- `StatusBadge` — PC / TRADE / SELL / OPEN / PRIVATE / SOLD / PENDING pill.
- `GBadge` — Grail Rating badge (ICONIC / SCARCE / RISING / GRAIL, or hidden below threshold).
- `GrailEstimatePanel` — estimate, likely range, confidence, last sale, 30D/90D averages;
  renders an explicit "insufficient data" state instead of a fabricated number.
- `MarketTicker` — SVG line/scatter chart of true-calendar-spaced completed sales with
  hover tooltip (date/price/venue/verified), period toggle (30D/90D/1Y/2Y/ALL), and an
  explicit empty state for sparse/no data (never interpolated).
- `CollectionGrid` — responsive card grid, filterable by status; empty state for a
  zero-card collection.
- `CollectionSummary` — total estimated value, Grail count, movers, all derived from the
  same estimate pipeline the card terminal uses (single source of truth, no duplicated math).
- `LoadingState` / `ErrorState` / `EmptyState` — shared primitives every data-driven view uses.

Pages: `collectionHome.js` composes Nav + CollectionSummary + CollectionGrid.
`cardTerminal.js` composes Nav + CardImage + GrailEstimatePanel + MarketTicker + GBadge +
BUY/OFFER/TRADE action row (disabled/inert in Milestone 1 — commerce is Phase 4).

## C. Data model / API map

Layer separation follows HANDOFF §19.8 exactly: card identity, owned instance, market
transaction, and derived analytics are never the same record.

- **CARD_MASTER** (`app/models.py`) — canonical card identity: sport, year, manufacturer,
  product, set, subset, player, card_number, parallel, print_run, rookie/autograph/relic
  flags, image paths. Extended from the scaffold's single-card `CARDS` dict to a small
  demo catalog (5 cards) so the Collection view has real variety, including cards with
  **no** market data yet — an intentional demonstration of "sparse data stays sparse."
- **CARD_INSTANCE** (`app/models.py`, `COLLECTION`) — a demo user's owned copies: grade,
  cert, acquired price/date, status. Stored as an in-process seed list for Milestone 1;
  the shape matches HANDOFF §12 so swapping in real persistence (Postgres) later is a
  storage-layer change only, not a data-model change.
- **TRANSACTION** (`app/db.py`, `sales` table, unchanged from scaffold) — completed sales
  observations: venue, date, price, source_url, verified flag, dedup key.
- **Derived analytics** (`app/valuation.py`, new) — `grail_estimate()` and `grail_rating()`
  are pure functions over CARD_MASTER + trend metrics; never persisted as if they were
  transactions, always recomputed, always carry a confidence/derivation note.

API surface:
```
GET  /api/cards                    — CARD_MASTER catalog
GET  /api/cards/{id}                — one CARD_MASTER + current estimate + rating
GET  /api/cards/{id}/trend          — transaction-level sales + rollup metrics (unchanged)
POST /api/cards/{id}/refresh        — trigger source adapters now (unchanged)
GET  /api/cards/{id}/refresh-log    — adapter run history (unchanged)
GET  /api/collection                — demo CARD_INSTANCE list, each joined to its
                                       CARD_MASTER + current estimate
GET  /api/collection/summary        — aggregate value, Grail count, status breakdown
```

## D. First 3 milestones

1. **Collection Home + Card Market Terminal** (this change) — real component architecture,
   wired to the market engine, local assets only, full loading/error/empty coverage.
2. **Scan/Add** — image capture → OCR/identification stub → CARD_MASTER match-or-create →
   new CARD_INSTANCE → run valuation/rating → land in Collection. No real vision model in
   this environment; ships as a manual "identify + confirm" form with the same data path
   real scanning would use, so swapping in a vision model later doesn't change the pipeline.
3. **Wants + Trade Box (read-only)** — a user can mark cards wanted and mark instances
   TRADE-eligible; a simple "cards I could get for what I have" match view. Still no
   commerce — this is Phase 3 in HANDOFF §17, ahead of offers/auctions/payments (Phase 4).

## E. Issues found in the existing scaffold

- `CARDS` in `models.py` hardcoded a single card, which makes "Collection" meaningless —
  extended to a small catalog (see C).
- No collection/ownership concept existed at all — everything was market-data-only.
- No derived-valuation layer — the frontend would have had to compute "the number" itself,
  which risks exactly the fake-precision problem HANDOFF §6 warns against. Added
  `valuation.py` as the single place that turns transactions into an estimate.
- `static/index.html` in the scaffold is a single-file demo page (inline styles/script) —
  fine for proving the data pipeline, but not the "real component architecture" Milestone 1
  asks for. Replaced with the modular structure in B, keeping the API untouched apart from
  the additions above.
- `db.py`'s `sales` table declared `UNIQUE(card_id, grade, venue, sold_at, price,
  COALESCE(external_id,''))` — SQLite does not allow expressions in a table-level UNIQUE
  constraint (only in `CREATE INDEX`), so `init_db()` failed outright. Fixed by giving
  `external_id` a `NOT NULL DEFAULT ''` and dropping the `COALESCE` from the constraint.
- `sales()`/`trend()` require an exact `(card_id, grade)` match with no normalization —
  acceptable for Milestone 1 (single graded state per demo card) but flagged for Phase 1
  ("grade normalization" is already on the scaffold's own README TODO list).

## F. Marketplace domain boundaries and state machines

Marketplace is a layer *on top of* Collection, not a fork of it. `CARD_INSTANCE` gains an
`availability` state (already modeled in HANDOFF/MARKETPLACE spec: PC, OPEN_TO_OFFERS,
TRADE, SELL, AUCTION, PRIVATE, PENDING, SOLD/TRADED) instead of the marketplace owning its
own copy of "what this card is." New marketplace-only entities — `Listing`, `Auction`,
`Bid`, `Offer`, `TradeProposal`/`TradeItem`, `Settlement` — reference `card_instance_id` and
`card_master_id` by id only. The trade state machine from the spec
(`DRAFT → PROPOSED → COUNTERED → ACCEPTED → LOCKED → AUTHENTICATION? → SHIPPING/CUSTODY →
SETTLED → COMPLETE`, with `DECLINED/EXPIRED/CANCELLED/DISPUTED/FAILED_*` branches) governs
transitions on `TradeProposal`, not on `CARD_INSTANCE` directly — the instance only exposes
the coarse availability state derived from wherever its active proposal/listing sits.

## G. Collection instances → marketplace inventory without duplicating identity

An instance becomes actionable by setting `availability` plus, when relevant, creating a
`Listing`/`Auction` row that points at it — it never gets re-described. `CARD_MASTER` stays
the single source of "what this card is"; `CARD_INSTANCE` stays the single source of "which
physical copy, owned by whom, in what condition"; marketplace rows are pure references plus
transaction-specific fields (price, terms, expiry). Ending a listing (sold, cancelled,
expired) is a status flip on the marketplace row, not a rewrite of the instance or the card.

## H. Settled transaction → verified market-data graph

On `TradeProposal`/`Auction`/`Offer` reaching `COMPLETE`, a `Settlement` event writes one
row into the same `sales`/`TRANSACTION` table the source adapters write into — same schema,
same dedup key shape, `venue = "The Grail"`, `verification_status = GRAIL_VERIFIED` (the
strongest tier, per HANDOFF §12, since it's a first-party settled trade, not a scraped
listing). Ownership transfer and the market-graph write happen in the same transaction so a
completed trade can never silently fail to improve future estimates. Cash-only trades write
a normal transaction; card-for-card trades write a valuation-snapshot-based observation
tagged distinctly so `grail_estimate()` can weight direct cash sales more heavily than
imputed trade values, per the spec's fee/consideration guidance.

## I. Trade Table drill-down into card analytics in-place

Each `TradeItem` in the Trade Table renders via the same `CardImage` + `GrailEstimatePanel`
+ `MarketTicker` components as the Card Market Terminal (component reuse, not a second
implementation) inside an expandable row/panel — clicking a card expands its ticker without
navigating away or losing negotiation state, because the trade draft lives in its own store
independent of whichever card panel happens to be expanded.

## J. Grail Rating computation and versioning

`valuation.grail_rating()` implements the spec's five 0–100 dimensions (Value, Demand,
Scarcity, Significance, Momentum) and composite
`0.25*Value + 0.25*Demand + 0.20*Scarcity + 0.20*Significance + 0.10*Momentum`, banded at
90/80/70. Significance is the one dimension that is not purely derived (it encodes
iconic-card/editorial judgment per the spec's override path) — Milestone 1 seeds it
per-card in `CARD_MASTER` rather than computing it, with a `significance_source` field
(`"editorial"` vs a future `"model"`) so the override stays auditable instead of silently
blended into the algorithmic score. Every rating result carries the score version
(`GRAIL_RATING_VERSION` constant in `valuation.py`) so historical ratings shown on old
transactions/screenshots remain explainable even after the formula changes.
