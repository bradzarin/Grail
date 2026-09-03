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

- `app/models.py` — CARD_MASTER catalog (`CARDS`, 8 modern demo cards across
  basketball/soccer/baseball plus 5 real 1952 Topps/Bowman checklist entries — see
  "Card catalog scope" below), the demo user's owned copies (`COLLECTION`), and a
  sample second collector's inventory (`OPPONENT_COLLECTION`, Trade Table demo only).
  Each card carries `primary_color`/`secondary_color`/`jersey_number` — inputs to the
  generated card art, not photo metadata (see "Card art" below).
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
  at a past date — see `app/portfolio.py`. Also: `market_commentary()`, the card-page
  write-up — every sentence is conditioned on a real number (spread vs. estimate, momentum,
  sale count, confidence) or a curated tag, never a fixed template, so it reads differently
  card to card instead of like filler text; and `liquidity_profile()`, which classifies a
  card as Actively/Regularly/Thinly Traded or a Hold purely from its real 90D sale count —
  a card can be valuable and still be a hold, and this makes that visible instead of
  collapsing everything into one price.
- `app/portfolio.py` — the portfolio-level lens on top of the same per-card estimate:
  `performance_series()` reconstructs total portfolio value over time by replaying
  `grail_estimate()` at each real sale date (not a fabricated trend line), `breakdown()`
  groups the collection by sport or by player, and `discover_movers()` ranks the whole
  catalog by real momentum, reasoned against what's already owned (the Discover
  lifecycle stage — see `docs/POSITIONING.md`). Nothing here is a separate signal from
  the rest of the app; it's the same estimate/momentum every card page already computes.
- `static/` — the frontend: plain HTML + CSS + native ES modules, no build step (see
  "Why no framework" below). `js/components/CardPanel.js` is the shared card
  hero+estimate+ticker used by the standalone Card Market Terminal, including the
  commentary write-up and liquidity badge. `js/components/GrailRatingPanel.js` renders
  the full 5-dimension G-rating breakdown (not just the pill) — same `rating.dimensions`
  the API already returned, just made visible. `js/components/PortfolioChart.js` and
  `BreakdownWidget.js` render the portfolio graph and sport/player breakdown on Home.
  `js/components/CardArt.js` generates every card face (see "Card art" below) and is
  used everywhere a card renders — tiles, thumbnails, hero. `js/grades.js` is the shared
  Raw/PSA/BGS/SGC/CGC grade list every grade picker in the app uses.
  `js/components/AddCardForm.js` (Market page) creates a new catalog card from real
  user-supplied identity — see "Card catalog scope" below.
- `app/cardgen.py` — `slugify()`/`palette_for()`, the id-generation and deterministic
  generated-art color assignment shared by `POST /api/cards` and the bulk checklist
  loader, so both paths build a `CardSpec` the same way.
- `app/checklist.py` + `app/data/*.json` — the 60,234-card bulk checklist registry
  (13 sources so far, growing), kept separate from `CARDS` — see "Bulk checklist" below.

## Card art

Every card face is generated SVG (`js/components/CardArt.js`) by default — not a
downloaded photo. Real card-manufacturer photography, marketplace listing photos, and
similar are someone else's copyrighted work, and this repo has no license for any of
that (the handoff itself flags this: "use properly licensed/authorized imagery in
production," `HANDOFF.md` §14/15). Generation is deterministic from
`primary_color`/`secondary_color`/`jersey_number`/`player`/`team`, so it's also what
makes the catalog look like one coherent product instead of mismatched stock photos.

What's clean to use: a real photo of a physical card someone actually owns, that they
took themselves. `POST /api/collection/{instance_id}/photo` (multipart, `side=front|back`)
lets an owner upload exactly that for their own `CARD_INSTANCE` — matches
`HANDOFF.md` §12's data model (`front_image`/`back_image` already specified there).
Saved to `static/uploads/{instance_id}-{side}.{ext}` (validated content-type, 15MB cap,
filename never taken from the upload — no path-traversal surface) and referenced with a
cache-busting query string for the same reason `ASSET_VERSION` exists (see "Asset
versioning" below — re-uploading under the same filename would otherwise risk a stale
cached copy). `CardArt(card, photoUrl)` renders that photo in place of the generated
card when present, everywhere that instance's photo is available (Collection, the Card
Market Terminal hero, the Trade Table) — and falls back to the generated card if the
photo ever fails to load, never a broken image. Catalog-wide views with no specific
owned copy (Grails, Discover, Suggested Pickups) always render generated, since there's
nothing real to photograph there. The upload control lives on the Card Market Terminal,
only when the card is owned.

## API

```
GET  /api/cards                    CARD_MASTER catalog + current estimate/rating
POST /api/cards                    create a new CARD_MASTER from real, user-supplied
                                    identity (see "Card catalog scope" below)
GET  /api/checklist/search         search the 60,234-card bulk checklist registry
                                    (?q=, ?limit=) — see "Bulk checklist" below
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
POST /api/collection/{id}/photo     upload a real photo of that owned copy
                                    (multipart, ?side=front|back; see "Card art")
DELETE /api/collection/{id}/photo   remove it, reverting to generated card art
GET  /api/discover                  real market movers, personalized to what's owned
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

## Card catalog scope

The catalog isn't fixed at 8 hand-picked cards — `POST /api/cards` lets anyone
add any real card, any sport, any era. This exists for the same reason manual
comp entry does: there's no free bulk card-checklist database covering
"every card since the 1950s" to wire in (same category of gap as live market
data, one level up the stack — see `docs/ARCHITECTURE.md` section E). TCDB has
a large community checklist but no public API; PSA's own spec pages are
effectively a checklist too but only browsable, not queryable by this app at
runtime. Rather than fake comprehensive coverage, a human who actually knows
the card enters its real identity (`app/main.py`'s `create_card`) — player,
sport, year, manufacturer, product, set, parallel, serial, grade (any of
Raw/PSA/BGS/SGC/CGC — `js/grades.js`). It becomes a first-class `CARD_MASTER`
immediately: generated card art (deterministic color assignment, same system
as the seed catalog), a real Grail Estimate/Rating once sales exist, fully
searchable from Market — not a second-tier record. `js/components/AddCardForm.js`
is the UI (Market page); `js/components/CardPanel.js`'s "Add to Collection"
form is the matching real add-to-`CARD_INSTANCE` path for any card, owned or
not, with the same full grade list.

`app/models.py`'s `CARDS` also carries five real 1952 checklist entries —
Mickey Mantle 1952 Topps #311, Mickey Mantle 1952 Bowman #101, Jackie Robinson
1952 Topps #312, Eddie Mathews 1952 Topps #407 (his rookie, the last card in
the set), and Andy Pafko 1952 Topps #1 (the set's opening card) — looked up by
hand via PSA's public Auction Prices Realized search
(`psacard.com/auctionprices/search?q=...`, no login required), which also
confirmed the real ordered start of the 1952 Topps checklist (#1–#15) card by
card. These five follow `POST /api/cards`'s "no fake precision" rule exactly:
no population or sales data was fabricated to fill them out — they render
with an unscored estimate and no comps until real sales are logged, same as
any card added through the form.

### Bulk checklist: 60,234 real cards across thirteen sources

Beyond those five, `app/checklist.py` holds a much larger real index —
currently thirteen sources, registered in `SOURCES` (`app/checklist.py`):

1. **Every Topps Baseball base card, 1952–2016** (41,823 rows: card number,
   team, player) — `app/data/topps_baseball_1952_2016.json`. TCDB (the
   largest community checklist site) has no official export — its own forum
   says so directly when someone asks for exactly this ("Exportable Complete
   Checklists" thread) — but a reply in that same thread points to a
   community-maintained archive (`thirdring.net/download/topps_*.zip`) with
   real, structured checklists per year. Spot-checked against PSA's public
   Auction Prices Realized search before import (1952 #1 Andy Pafko, #311
   Mickey Mantle, #407 Ed Mathews all matched exactly).
2. **2025-26 Panini Origins Basketball, every card** (5,277 rows — base,
   parallels, inserts, autos, print runs) — `app/data/panini_origins_basketball_2025_26.json`,
   from Panini's own downloadable checklist CSV for the product. Panini
   posts one of these per release; it just isn't a historical bulk archive.
3. **2022-23 Topps UEFA Club Competitions Soccer, every card** (425 rows —
   base, inserts, autographs) — `app/data/topps_uefa_club_competitions_2022_23.json`,
   from Beckett News's own downloadable XLSX checklist, embedded free in
   their article.
4. **2025 Topps Chrome Football, every card** (1,926 rows across 37 real
   subsets — base, rookies, seven autograph families, relics, dozens of named
   inserts) — `app/data/topps_chrome_football_2025.json`, from a Beckett News
   XLSX.
5. **2025-26 O-Pee-Chee Hockey, every card** (909 rows across 17 real
   subsets) — `app/data/opeechee_hockey_2025_26.json`, from a Beckett News
   XLSX. First hockey coverage in this registry.
6. **2024 Upper Deck Golf, every card** (649 rows across 19 real subsets) —
   `app/data/upperdeck_golf_2024.json`, from a Beckett News XLSX. First golf
   coverage.
7. **2025 Panini Prizm NASCAR Racing, every card** (495 rows across 14 real
   subsets) — `app/data/panini_prizm_nascar_2025.json`, from a Beckett News
   XLSX. First racing coverage.
8. **2023 Panini Select WWE, every card** (790 rows across 16 real subsets —
   base tiered by arena level, autographed memorabilia, several signature
   families) — `app/data/panini_select_wwe_2023.json`, from a Beckett News
   XLSX. First wrestling coverage — `js/grades.js`'s `SPORTS` list now
   includes "Wrestling" to match.
9. **2023-24 Donruss Soccer, every card** (1,250 rows across 29 real
   subsets) — `app/data/donruss_soccer_2023_24.json`, from a Beckett News
   XLSX.
10. **2024-25 Panini Select Premier League Soccer, every card** (845 rows
    across 27 real subsets, tiered base set) —
    `app/data/panini_select_premier_league_2024_25.json`, from a Beckett
    News XLSX.
11. **2026 Panini Prizm FIFA World Cup Soccer, every card** (3,734 rows
    across 118 real subsets — the largest single product in this registry,
    players from all 48 qualified nations) —
    `app/data/panini_prizm_world_cup_2026.json`, from a Beckett News XLSX.
12. **2025-26 Topps Chrome Basketball, every card** (1,254 rows across 43
    real subsets) — `app/data/topps_chrome_basketball_2025_26.json`, from a
    Beckett News XLSX — second basketball source alongside Panini Origins.
13. **2025 Bowman Chrome Baseball, every card** (857 rows across 30 real
    subsets, prospect- and rookie-heavy) —
    `app/data/bowman_chrome_baseball_2025.json`, from a Beckett News XLSX —
    a modern complement to the vintage Topps Baseball archive.

Soccer now has four sources (#3, #9, #10, #11) spanning club and
international competition, two different manufacturers, and both a
club-season and a World Cup product — deliberately built out further than
any other sport so far, rather than resting on the one UEFA source.

Beckett publishes a checklist article like #3-#13, frequently with a matching
free XLSX download, for most notable releases they cover, across every
sport, going back years — a real, large, free, structured source this repo
hadn't tapped until a user found one directly. #4-#13 came from the same
place, pulled directly rather than waiting for another one to be handed over
— `app/data/` holds only the normalized checklist rows (year, card number,
team, player, set name, rookie/autograph flags), never Beckett's own article
text or the original downloaded files.

A paid alternative also exists — SportsCardsPro/PriceCharting has a real
multi-sport checklist + current-price API — but it needs a subscription and
personal API token (and its API/CSV only cover current values, not
transaction-level sales history, so it wouldn't feed the valuation engine
below even once subscribed), so it isn't wired in here.

This stays deliberately **out** of `CARDS`: `main.py`'s startup/periodic
refresh loop calls the source adapters on every `CARDS` entry, and
Discover/Market/Grails/Suggested Pickups all iterate `CARDS.values()` eagerly
— merging tens of thousands of unrated commons in there would slow every one
of those down and bury real signal in noise. Instead:

- `GET /api/checklist/search?q=...` searches this index directly (a linear
  scan over the in-memory records — a few milliseconds, no index needed at
  this size) and excludes anything already hand-curated in `CARDS`, so e.g.
  the researched 1952 Mantle doesn't also show up as an unrated duplicate.
  The Market page (`js/pages/market.js`) calls this alongside `GET /api/market`
  whenever there's a search query, and merges both into one grid.
- `_card_or_404` (`main.py`) checks `CARDS` first, then this index — the
  moment a bulk card is actually opened or added to a collection, it's
  promoted into `CARDS` and behaves like any other tracked card from then on
  (refreshed, eligible for Market/Discover/Grails), exactly like a card
  entered by hand through `POST /api/cards`. Nothing is promoted just by
  existing in the index — only by a real user action touching that card.

Three sources, two products fully covered — nowhere near everything. Some
gaps were checked directly and ruled out, not just unsearched:

- **TCDB** has the broadest real coverage of any single site (all sports, all
  eras, inserts/parallels/autos) but explicitly declined bulk export when
  asked on their own forum, and their `robots.txt` allowing crawlers on
  checklist pages is about search indexing, not license to extract the whole
  database — so this doesn't scrape TCDB, same standard as Heritage above.
- **Topps.com's official checklists** are real but sit behind Cloudflare
  bot-detection (confirmed by hitting the challenge page directly) — blocked
  for automated access regardless of who's asking, and current-releases-only
  even if it weren't.
- **SportsCardsPro/PriceCharting** ($49/mo Legendary tier) is real and
  broader — confirmed variant-level 1952 Topps coverage (639 tracked items,
  not just the 407 base cards) — but it's paid, per-set for bulk (a CSV per
  set page, rate-limited to one every 10 minutes — not a single "everything"
  download), and its API/CSV only cover current values, not sales history.

**Panini and Beckett News are real, confirmed, and not exhausted yet.**
Panini posts a downloadable checklist CSV per product at release — source #2
above came straight from one. Beckett News goes further: they publish a
checklist article, often with a matching XLSX download, for most releases
they cover, across every sport, with a dedicated "Checklists" category per
sport going back years — source #3 above is one single article out of what's
likely thousands. Both are per-product, not one historical archive like the
Topps Baseball source, so growing coverage here means pulling more of them
one product at a time — real work, but real and free every time, and exactly
what `SOURCES` (`app/checklist.py`) is built to keep absorbing.

`SOURCES` is a registry, not a single hardcoded path, specifically so the
next real archive that turns up (another product, another sport) is a
one-line addition — normalize it into the same
`{year, card_number, team, player, set_name?, rookie?, autograph?, print_run?}`
row shape, drop the JSON in `app/data/`, add a `BulkSource` entry. `POST
/api/cards` remains the fallback for anything without a bulk source, same as
always.

## Asset versioning

Every page is served from `/assets/{ASSET_VERSION}/js/...` and `/css/...`,
where `ASSET_VERSION` is set once at process start (`app/main.py`). A JS/CSS
edit needs a server restart to show up — `Cache-Control: no-cache` alone
wasn't reliably enough (something between browser and origin kept serving a
stale file even past hard-refreshes), and a URL that changes on restart can't
return stale bytes regardless of what any cache in the chain does with
headers. Relative imports between JS files resolve against the versioned URL
automatically, so only the page template needed to change, not every file.

## Why no framework

`handoff/HANDOFF.md` recommends Next.js + TypeScript for production but says the
recommendation isn't binding as long as product behavior is preserved. This was built
on a machine without Node/npm, so the frontend is dependency-free ES modules instead —
runnable with nothing but a browser and this API. Component boundaries in
`static/js/components/` are drawn to map 1:1 onto future React components if/when the
project moves to Next.js.
