# The Grail

A collector-first sports-card operating system and, ultimately, a transparent card
marketplace. **eBay digitized the classified ad. The Grail digitizes the collection.**

Scan → Collection → Value → Want List → Trade Box → Match → Negotiate → Transaction.

## In this repo

- [`handoff/`](handoff) — the founder handoff: product thesis, UX direction, market/data
  rules, visual references, prototypes and the market-data engine scaffold, unmodified.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — proposed repo structure, component map,
  data model/API map, milestones and marketplace extension points.
- [`apps/api/`](apps/api) — FastAPI service: the market-data API plus the Milestone 1
  frontend (Collection Home + Card Market Terminal), served together.

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

Milestone 1 of 3 in `docs/ARCHITECTURE.md` — Collection + Card Market Terminal. No
scanning, wants/trade, or commerce yet by design (`handoff/HANDOFF.md` §17).
