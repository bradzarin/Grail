# The Grail — Live Market Ticker scaffold

This project turns the card-market chart into a real data service rather than a decorative front-end curve.

## What works now

- FastAPI API + SQLite transaction store.
- One canonical card/grade (`mj-scoring-kings-5`, PSA 8).
- Known public transaction observations seed the database.
- `/api/cards/{id}/trend` returns transaction-level sales.
- `POST /api/cards/{id}/refresh` checks enabled sources immediately.
- Background refresh runs every `REFRESH_SECONDS` (default 15 minutes).
- Unique database key de-duplicates repeated observations.
- Front end polls the API every 60 seconds and has a **CHECK FOR UPDATES** button.
- 30D / 90D / 1Y / 2Y x-axes use true calendar spacing. Sparse periods remain sparse.
- Hover shows exact date, price, and venue. No interpolated monthly values.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000`.

## Production source strategy

### eBay
Use the official **Marketplace Insights API** for sold-history when The Grail has been approved for access. eBay documents this as Limited Release. Configure `EBAY_MARKETPLACE_INSIGHTS_TOKEN` and the exact approved endpoint. The code intentionally does **not** scrape eBay completed listings.

### PSA
PSA Auction Prices Realized is a public, daily-updated auction-results product. For a prototype, an exact permitted public results URL can be configured using `PSA_APR_URL`. For production scale, pursue a data agreement/feed rather than depending on brittle page parsing.

### Fanatics Collect
The adapter checks Fanatics' public Sales History page and only stores sales actually present in returned public HTML. Fanatics may render results client-side; when no rows are exposed, the adapter returns zero rather than inventing values. A production partnership/API is preferable.

### Heritage / Card Ladder / Sports Card Investor / other aggregators
Add adapters only under terms that permit automated ingestion. A licensed CSV/API adapter should be favored. Do not silently scrape behind authentication or bot controls.

## Data quality pipeline to add next

1. Canonical card identity (`year/product/set/card_number/parallel/serial`).
2. Grade normalization and certification ID.
3. Venue fee / buyer-premium normalization.
4. Duplicate detection across aggregators and original auction venues.
5. Exact-match confidence score.
6. Outlier detection, but never delete the original transaction.
7. Source priority (original auction venue > aggregator).
8. Rolling quote/range, volume, volatility, liquidity and confidence.
9. Store raw payload/hash for auditability.
10. Per-card source health and last-updated timestamps.

## Important

The front end's trend line connects *actual completed sales*. It does not manufacture daily/monthly prices between transactions. A future "Grail Index" can be a separate computed series, clearly labeled as an index/estimate.
