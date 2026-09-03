# The Grail

A collector-first sports-card operating system and, ultimately, a transparent card
marketplace. **eBay digitized the classified ad. The Grail digitizes the collection.**

Scan → Collection → Value → Want List → Trade Box → Match → Negotiate → Transaction.

## In this repo

- [`handoff/`](handoff) — the founder handoff: product thesis, UX direction, market/data
  rules, visual references, prototypes and the market-data engine scaffold, unmodified.
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
- **Catalog size** — 5 demo cards with real local imagery, one with real seeded market
  history. Small on purpose: every number shown is honestly computed from what's
  actually there, never padded to look fuller (see `docs/ARCHITECTURE.md` section E
  and the "no fake precision" principle in `handoff/HANDOFF.md` §6).
- **Wants** — stored in the browser's `localStorage` for this demo, not the account.
- **Trade Table** — a real interactive builder over real Collection data, paired
  against one sample opponent inventory. Not a live matched trade between two users.
