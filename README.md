# The Grail

Market infrastructure for sports cards — real-time portfolio intelligence, market
data, and transactions, in one platform. Not a collection tracker, a scanner, a
pricing guide, or a marketplace — the platform that connects those into one
lifecycle: **Discover → Analyze → Buy → Own → Value → Grade → Track → Trade → Sell**.

**eBay digitized the classified ad. The Grail digitizes the collection.**

## In this repo

- [`handoff/`](handoff) — the founder handoff: product thesis, UX direction, market/data
  rules, visual references, prototypes and the market-data engine scaffold, unmodified.
- [`docs/POSITIONING.md`](docs/POSITIONING.md) — the current product thesis, competitive
  framing, and an honest lifecycle-stage-by-stage read of what's actually built.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — proposed repo structure, component map,
  data model/API map, milestones and marketplace extension points.
- [`apps/api/`](apps/api) — FastAPI service: the market-data API plus the full frontend
  (Home dashboard, Card Market Terminal, Collection, Market, Trade Table, Scan+Add,
  Grails, Wants, Alerts, Profile), served together.

## Run it

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000`. See [`apps/api/README.md`](apps/api/README.md) for details.

## Status

Every surface from the handoff's preferred UI references now exists and is wired to
real backend logic (Grail Estimate/Rating, market trend, collection, suggested
pickups, a Trade Table demo). What's still a preview rather than a finished feature:

- **Commerce (Buy/Offer/Trade settlement, auctions, payments)** — intentionally last,
  per `handoff/HANDOFF.md` §17 ("do not begin with commerce until Collection + Card
  Terminal + Scan/Add are excellent"). Buttons are present and clickable so the flow
  is visible, but nothing settles a transaction yet — that's the Marketplace milestone.
- **Auth / multiple users** — one seeded demo collector, no accounts yet (Phase 1).
- **Catalog size** — 8 demo cards, all with real market history (looked up by hand
  through PSA's Auction Prices Realized, since none of eBay/PSA/Heritage/Card Ladder/
  Sports Card Investor have a free automated path to this data — see
  `apps/api/README.md` "Market data provenance"). Small catalog on purpose: every
  number shown is honestly computed from what's actually there, never padded to look
  fuller (see `docs/ARCHITECTURE.md` section E and the "no fake precision" principle
  in `handoff/HANDOFF.md` §6).
- **Card art is generated, not photographed** — every card face is rendered by
  `apps/api/static/js/components/CardArt.js` (team-color gradient, jersey number,
  player name) instead of a photo. Real card scans are the manufacturer's/
  photographer's copyrighted work; the handoff itself says to "use properly
  licensed/authorized imagery in production" (`HANDOFF.md` §14/15), and this repo has
  no license for Messi/Ohtani/Zidane/etc. card photography. The generated system also
  makes the whole catalog look like one coherent product instead of mismatched stock
  photos — production would swap in licensed photography behind the same component.
- **Wants** — stored in the browser's `localStorage` for this demo, not the account.
- **Trade Table** — a real interactive builder over real Collection data, paired
  against one sample opponent inventory. Not a live matched trade between two users.
