# THE GRAIL — CLAUDE DEVELOPMENT HANDOFF
Version: 2026-09-02

## 1. North Star

The Grail is not another card-listing marketplace. It is a collector operating system and, ultimately, a transparent card marketplace.

Core thesis:
**eBay digitized the classified ad. The Grail digitizes the collection.**

The product begins with ownership and intelligence:
**Scan → Collection → Value → Want List → Trade Box → Match → Negotiate → Transaction.**

The central product insight is that a collector's collection should behave like a stock portfolio. Each card is a position. Multiple copies behave like multiple shares. Every card should have a persistent market identity, a market history, a current range/estimate, liquidity and demand signals, and a clear path to buy, offer, trade, or sell.

Long-term positioning:
**The Hobby lives here.**

Brand line:
**LOVE THE HOBBY. Know what you own. Find what you love. Trade what you don't. Build your collection.**

## 2. Product Vision

The Grail should become the central hub for a fragmented sports-card universe:
- Collectors with high-value collections chasing true grails.
- Active hobbyists building sets and player collections.
- Kids/families collecting favorite players.
- People returning to the hobby.
- Pack/box buyers who hit valuable cards and need immediate identification and market context.
- Dealers/card-show participants who currently use stickers, eBay searches, and multiple browser tabs to establish prices.

The user experience should make a physical card immediately legible as a digital asset: identify it, add it to a collection, estimate its value, show the evidence, track it over time, and create relevant collection/trade opportunities.

## 3. Product Principles — DO NOT LOSE THESE

1. **Collection-first, not listing-first.** The home screen should center My Collection.
2. **Card-centric.** The persistent object is the card/card instance, not a marketplace listing.
3. **Market transparency.** Never hide the evidence behind a single opaque number.
4. **No fake precision.** Prefer estimate + likely range + last sale + averages + confidence.
5. **Actual sales, not decorative curves.** Market charts connect completed transactions on true calendar spacing.
6. **Sparse data stays sparse.** Do not interpolate monthly/daily values merely to make a chart look like a stock.
7. **Simple on top, sophisticated underneath.** A child/new collector can use it; a dealer/power collector can drill down.
8. **Card imagery is the visual hero.** UI chrome must not compete with the cards.
9. **Premium card product first; financial terminal second.**
10. **Commerce should layer onto the collection graph, not define the product from day one.**

## 4. Preferred UX / Navigation

Primary navigation:
HOME | MARKET | + CARD / SCAN | TRADE | COLLECTION

Additional destinations:
GRAILS | WANTS | ALERTS | PROFILE

Home / My Hobby:
- Collection value and performance.
- Grail count.
- Relevant market movement.
- Player/card activity.
- Trade matches.
- Negotiations.
- Watchlist.
- Collection Intelligence / suggested pickups.

Collection:
- Portfolio view.
- Gallery / digital display case.
- Sets view.
- Public "My Top 10."
- Filters by sport, player, era, set, grade, status and Grail status.
- Statuses: PC, TRADE, SELL, OPEN, PRIVATE, SOLD, PENDING.

Every card detail:
- Card image.
- Identity / metadata.
- Grail Estimate and market range.
- Last sale.
- Confidence.
- BUY / OFFER / TRADE.
- Market Trends.
- Market Read.
- Grade spread.
- Population / print run / scarcity.
- Demand / liquidity / momentum.
- Provenance / cert / transaction evidence where available.

## 5. Market Trends / "Every Card Gets a Ticker"

This is a critical product and business-model feature.

The card page should feel like a simple Bloomberg terminal for a collectible:
- 30D / 90D / 1Y / 2Y.
- RAW / relevant graded states (PSA 7/8/9/10 etc.).
- Current Grail Market Price / Estimate.
- Dollar and percentage change.
- Average sale.
- Number of completed sales.
- High / low.
- Market range.
- Population.
- Liquidity.
- Volatility.
- Momentum.
- Confidence.
- Plain-English Market Read.

Hard requirements:
- X-axis must reflect the selected real calendar period.
- Each point is an actual completed transaction when showing transaction-level series.
- Hover/click shows exact date, price, venue, grade and verification status.
- No interpolated monthly values in the transaction chart.
- Unsold asks are not sales.
- Original auction venue should outrank duplicate aggregator records.
- Duplicate transactions across aggregators must be de-duplicated.
- Keep raw source payload/hash and source URL for auditability in production.
- A future computed "Grail Index" may be a separate derived series, but it must be clearly labeled as an estimate/index rather than a sale history.

Reference implementation:
`market_engine/grail_market_live/`

Reference UI:
`prototypes/mj_scoring_kings_terminal.html`
`assets/market_trends_reference.png`

## 6. Grail Estimate

Do not present a single number as incontrovertible value.

Preferred output:
- Grail Estimate: rounded midpoint / market quote.
- Likely range.
- Last comparable sale.
- 30D / 90D averages.
- Transaction count.
- Confidence: HIGH / MEDIUM / LOW.
- Source freshness.

Methodology direction:
- Exact card/parallel/grade match weighted most heavily.
- Recency weighting.
- Transaction-quality weighting.
- Robust outlier detection.
- Observed grade premiums, not fixed multipliers.
- Scarcity factors: print run, PSA population, active supply, owner count, want count.
- Original venue > aggregator.
- Never delete an outlier from the audit trail; flag/down-weight it.

## 7. Grail Rating / G Mark

The G is strategically important and intended to become protectable brand/IP.

A Grail is not simply "a card worth more than $1,000."

Rating dimensions:
- VALUE — high dollar value / value tier.
- DEMAND — transaction velocity, wants, collector attention.
- SCARCITY — print run, population, active supply.
- SIGNIFICANCE — iconic player/card/set/era importance.
- MOMENTUM — confirmed market acceleration.

Examples of labels:
ICONIC | SCARCE | RISING | LEGEND / GRAIL

The rating can elevate:
- $1K+ cards.
- Cards with exceptional transaction demand.
- Key/iconic cards from an era or set even when the price is lower.

Do not turn the G into a gamified casino mechanic. It should communicate collecting significance and market intelligence.

## 8. Scanner / Card Ingestion

Scan front/back and identify:
player, year, manufacturer, product, set, subset, card number, parallel, serial number, rookie status, autograph, relic, game-used, variation, grader, grade and cert number.

Then:
1. Match/create canonical Card Master.
2. Create user's Card Instance.
3. Run valuation.
4. Run Grail Rating.
5. Add to Collection.
6. Offer status: PC / Trade / Sell / Open / Private.
7. Surface relevant wants, set gaps, grade economics and market activity.

Grade Assist for raw cards:
- Visible centering.
- Corners.
- Edges.
- Surface.
- Estimated grade likelihood.
- Grading economics.
- Clear disclaimer that this is an estimate.

## 9. Trade / Commerce Roadmap

Each card eventually supports BUY / OFFER / TRADE.

Trade Engine:
- Visual two-sided trade table.
- Cards + optional cash.
- Market estimate on each side.
- Difference.
- Market-alignment meter.
- Values are informational, not mandatory.

Trade Finder:
- Match user's wants against other users' collections/trade boxes.
- Filter: **ONLY SHOW CARDS I CAN TRADE FOR.**
- Long-term: multi-party/circular trades.

Trust:
- Identity verification.
- Collector Reputation Score.
- Completed trades/sales.
- Shipping performance.
- Disputes.
- Optional verified-only high-value trading.
- High-value transactions can route through The Grail for authentication.

Auctions:
- Buy Now.
- Make Offer.
- Trade.
- Trade + Cash.
- Auction.
- Anti-sniping extensions.

Junior Collector:
- Parent-controlled.
- No unrestricted payments.
- Avoid gambling-like mechanics.

## 10. Business Model Direction

Blended recurring + transaction model.

Working architecture:
- FREE: collection, scanning, basic comps, marketplace/trades. Approx. 5% transaction fee.
- GRAIL+: approx. $9.99/month. Advanced comps, Market Pulse, Trade Finder, Grade Assist, portfolio analytics, lower transaction fee (~3.5%).
- GRAIL PRO: approx. $24.99/month. Bulk scan/upload, dealer tools, export/API, storefront, analytics, automated pricing, lower fee (~2–2.5%).

Other potential revenue:
- Protected trade fee.
- High-value authentication.
- Shipping margin.
- Grading referrals.
- Vault/storage.
- Dealer tools/API/data.

Transaction philosophy:
- Lower than eBay.
- Consider fee caps.
- Trade + cash percentage applies to cash component, not the imputed value of cards.

These are working assumptions, not final pricing.

## 11. Data Moat

Five linked graphs:
1. OWN GRAPH — what collectors own.
2. WANT GRAPH — what collectors want.
3. VALUE GRAPH — what actually transacts and at what price.
4. TRADE GRAPH — what combinations clear.
5. TRUST GRAPH — which cards, identities and transactions can be trusted.

Flywheel:
Scan → Collection → Market Data → Want List → Trade Match → Negotiation → Transaction → Verified Sale → Better Market Data → More Users / Liquidity.

## 12. Data Model Direction

USER:
user_id, identity_status, age_classification, collector_score, transaction_count, trade_count, seller_rating, location_region, created_at.

COLLECTOR_PROFILE:
user_id, sports[], players[], teams[], eras[], sets[], card_types[], collecting_goals[], experience_level.

CARD_MASTER:
card_master_id, sport, year, manufacturer, product, set, subset, player, team, card_number, parallel, print_run, rookie, autograph, relic, game_used, case_hit, variation.

CARD_INSTANCE:
card_instance_id, card_master_id, owner_id, serial_number, raw_or_graded, grader, grade, cert_number, condition_estimate, front_image, back_image, acquired_date, acquired_price, status.

TRANSACTION:
transaction_id, card_master_id, card_instance_id, venue, date, sale_price, shipping, buyer_premium, raw_or_graded, grader, grade, transaction_type, source_url, verification_status, source_payload_hash.

Transaction types:
Auction | Buy Now | Accepted Offer | Trade | Trade + Cash.

Verification:
GRAIL_VERIFIED | EXTERNAL_VERIFIED | REPORTED | UNVERIFIED.

## 13. Visual Design System

The preferred direction evolved materially. Use the final direction, not the rejected experiments.

**Preferred aesthetic:**
- White / very light canvas.
- Generous whitespace.
- Strong black typography.
- Restrained prismatic violet/cyan/magenta accents.
- Gold only for premium/Grail status.
- Card imagery supplies most of the color.
- Thin borders and subtle shadows.
- Compact analytics.
- Distinctive editorial/sports-card typography.
- Bridge modern Color Blast / Kaboom / Obsidian / Prizm energy with retro Fleer/Jordan collecting.

Design thesis:
**"The canvas is Color Blast white; the cards supply the explosion."**
**"Color Blast designed the front end; Bloomberg designed the data layer."**

Avoid:
- Generic AI dashboard look.
- Oversized dashboard cards.
- Excessive boxes/borders/pills.
- Huge neon gradients.
- Dark sci-fi/gaming UI as the default.
- Sportsbook/casino language or aesthetics.
- Overly rounded components.
- Market chart overpowering the card.
- Giant serif headlines.
- Decorative fake charts.
- Card images loaded from brittle external URLs.

Desktop hierarchy:
**Large card image → card identity → Grail Estimate/range/movement → BUY/OFFER/TRADE → compact Market Trends → Market Read → Collection/Trade/Scan.**

Important visual reference:
`assets/preferred_interface_reference.png`

Logo:
`assets/the_grail_logo.png`

## 14. Image Reliability — Important Lesson

Broken card imagery repeatedly damaged the prototypes.

Rules:
- Never depend on random image-search URLs in a partner/demo build.
- Store demo assets locally in `/public/assets/cards/` or an equivalent managed bucket.
- Use stable object storage/CDN in production.
- Maintain `card_image` metadata with front/back, source, attribution/license where required, checksum and fallback.
- Add an image fallback component so a broken URL never collapses the UI.
- Preload/validate hero images.
- Use user-uploaded images for owned card instances where appropriate.

The handoff includes locally stored reference cards.

## 15. Included Card References

Provided by the founder / used in development:
- Lamine Yamal Topps Chrome rookie autograph /298.
- Shaquille O'Neal Beam Team.
- Michael Jordan Fleer card.
- Jude Bellingham Tier One Talent autograph /25.
- Actual 1993-94 Fleer Ultra Michael Jordan Scoring Kings #5 image.

Other cards explicitly requested for product examples:
- Panini 2024-25 Obsidian Soccer Jude Bellingham Real Madrid Supernova #13 /28.
- Panini 2025-26 Obsidian Soccer Supernova #1 Lamine Yamal FC Barcelona 53/60.
- Fleer Ultra 1993-94 Shaquille O'Neal #7 Power in the Key.
- Panini 2025-26 Donruss Road to FIFA World Cup Kaboom! Messi Argentina #1.
- 2026 Panini Prizm Monopoly World Cup Kylian Mbappé Color Blast Silver SSP Promo.
- 1986 Fleer #57 Michael Jordan Rookie.
- 1992-93 / 1993-94 Michael Jordan Scoring Kings (verify exact year/card identity in production).

Use properly licensed/authorized imagery in production.

## 16. Current Technical Scaffold

The included `market_engine/grail_market_live/` scaffold contains:
- FastAPI.
- SQLite transaction store.
- Canonical example card: `mj-scoring-kings-5`, PSA 8.
- Seeded known public transactions.
- Trend endpoint.
- Refresh endpoint.
- Background refresh.
- De-duplication.
- Front-end polling.
- True calendar x-axis.
- Hover details.
- Source adapter pattern for eBay / PSA / Fanatics.

Read its README before modifying.

Production source strategy:
- Prefer official/licensed APIs or data feeds.
- eBay sold-history access should use approved official access when available; do not silently scrape completed listings.
- PSA Auction Prices Realized may be used only consistent with permitted access; production scale should pursue a feed/agreement.
- Fanatics/public auction venues: favor partnership/API over brittle parsing.
- Card Ladder / Sports Card Investor / other aggregators: only automate ingestion under terms that permit it.

## 17. MVP / Build Order

V1 objective:
**Prove collectors will digitize their collections because doing so creates materially better intelligence and trade opportunities.**

Phase 1 — Foundation
- Production design system.
- Auth/profile.
- Canonical card model.
- Image storage.
- Scan/upload.
- Collection.
- Card detail.
- Market data service.

Phase 2 — Intelligence
- Grail Estimate.
- Grail Rating.
- Market Pulse.
- Watchlist/alerts.
- Portfolio analytics.
- Collection Intelligence.
- Grade Assist.

Phase 3 — Network
- Wants.
- Trade Box.
- Trade Finder.
- Collector profiles/reputation.
- Negotiation.

Phase 4 — Commerce
- Offers.
- Trades.
- Trade + Cash.
- Buy Now.
- Auctions.
- Payments.
- Shipping/authentication.
- Disputes.

Do not begin with breaks, mystery packs, crypto/NFTs, livestream selling, elaborate vaulting or too many categories.

## 18. Initial GTM Wedge

Recommended initial collecting communities:
- Modern soccer.
- 1990s basketball.

Rationale: modern global player demand + younger collector energy on one side; iconic, liquid nostalgia on the other.

## 19. What Claude Should Do First

1. Run and inspect every included prototype; do not blindly preserve its code.
2. Treat `preferred_interface_reference.png` as a design specification, not loose inspiration.
3. Treat `mj_scoring_kings_terminal.html` as the functional specification for the market terminal.
4. Treat the FastAPI market scaffold as a starting backend/data-ingestion architecture.
5. Build a production-oriented component system rather than another monolithic HTML demo.
6. Use local/stable assets so card images cannot break.
7. Preserve true calendar chart behavior and transaction-level evidence.
8. Separate:
   - Card identity data.
   - User-owned card instance data.
   - Market transaction data.
   - Derived analytics.
9. Make all market metrics explainable and source-auditable.
10. Build the Collection home first, then Card Terminal, then Scan/Add, then Wants/Trade.
11. Keep the interface simple enough for a new collector.
12. Do not add commerce complexity until collection + valuation UX is excellent.

## 20. Suggested Production Architecture

Frontend:
- Next.js + TypeScript.
- Componentized design system.
- Responsive desktop/mobile.
- Accessible interaction states.
- Charting library capable of true time-series scatter/line behavior and custom tooltips.

Backend:
- FastAPI or equivalent typed API service.
- PostgreSQL in production.
- Background job/queue for ingestion and analytics.
- Object storage + CDN for images.
- Source adapter layer.
- Audit/logging for market observations.
- Authentication and role/age controls.

Core services:
- Card Catalog / Identity.
- Collection.
- Image/Scan.
- Market Data.
- Valuation.
- Grail Rating.
- Search.
- Wants/Trade matching.
- Trust/Reputation.
- Commerce later.

This stack is a recommendation, not a binding requirement. Preserve the product behavior even if Claude recommends a different production stack.

## 21. Definition of "Good"

A partner should be able to open the product and understand within seconds:
1. What do I own?
2. What is it worth?
3. Why does The Grail think that?
4. What is moving?
5. Which of my cards matter most?
6. What should I look at next?
7. What can I do with this card?

A collector at a card show should be able to pull up a card and use The Grail as naturally as an investor checks a stock quote.

The product succeeds when the data makes the Hobby feel more transparent without making the Hobby feel less fun.


## 22. Marketplace / Auction / Trade Universe — Cornerstone, Not Add-On

The Marketplace is a cornerstone of The Grail ecosystem and must be designed as the action layer sitting directly on top of Collection + Market Intelligence.

The opportunity is not merely to charge less than eBay. It is to replace an inefficient, analog workflow with a transparent digital market. At card shows and card shops, prices are frequently stickers plus real-time phone searches. On eBay, the user often has to leave the listing experience to research sold comps, grade context and scarcity. The Grail should put the shared market truth beside the transaction.

A collector should be able to move seamlessly from:
**I own this → what is it worth? → what is the market doing? → who wants it? → what can I trade it for? → make/receive an offer → transact → update my Collection.**

This matters especially because high-end sports-card transactions can reach automobile- or house-level values. The UX therefore needs both the warmth/fun of collecting and financial-grade transparency, auditability and trust.

### Marketplace product requirements
- Canonical card market page with completed-sales ticker, active listings, auctions and trade availability.
- Collection card instances can be marked PC, Open, Trade, Sell or Auction without recreating the card identity.
- Buy Now, Auction, Make Offer, Trade and Trade + Cash.
- Signature visual Trade Table with both sides, card images, optional cash, market estimates and market-alignment indicator.
- Drill-down from any trade item to card-level market intelligence without abandoning the negotiation.
- Card-show/mobile mode should eventually make scanning, pricing and building a trade possible at the physical table.
- Market context must be visible during negotiation; values inform but do not dictate a trade because collector passion/preferences matter.
- Completed settled transactions feed the market graph and improve future estimates.

### Transparency is the differentiator
During a transaction, both sides should be able to see the same evidence: last verified sale, likely range, recent average, liquidity, grade context, population/scarcity, confidence and source freshness. For expensive transactions, layer in identity, cert/serial verification, provenance, authentication, escrow/custody and reputation.

### Grail Rating becomes actionable
The G badge should identify cards that matter because of a combination of value, demand, scarcity, significance and momentum. It should work across eras: a modern scarce high-demand parallel and an iconic vintage/1990s insert can both qualify for different reasons.

Detailed product behavior, state machines and data objects are in `MARKETPLACE_TRADE_AUCTION_SPEC.md`. Code-oriented starting contracts are in `marketplace_code/`.

### New visual references
- `assets/real_sales_chart_reference.png` — transaction-only chart and market narrative.
- `assets/card_detail_reference.png` — clean card hero + estimate/range/confidence hierarchy.
- `assets/card_detail_market_trend_reference.png` — card detail with market terminal below.
- `assets/full_dashboard_reference.png` — strongest full desktop dashboard composition including Collection/Grails/Suggested Pickups.
- `assets/stock_chart_reference.png` — stock-like trend visualization reference.
- `assets/trade_table_mobile_reference.png` — original Trade Table / Color Blast mobile visual north star.

## 23. Updated Product Architecture

The Grail should be thought of as five connected layers:
1. **IDENTITY** — canonical card catalog + user's physical Card Instances.
2. **PORTFOLIO** — Collection, value, performance, Grails and ownership history.
3. **INTELLIGENCE** — transaction history, estimates, trends, scarcity, demand, ratings and research.
4. **NETWORK** — Wants, Trade Boxes, collectors, reputation and matching.
5. **MARKETPLACE** — offers, trades, auctions, settlement, authentication and provenance.

The Marketplace is not deferred conceptually; it is deferred in build order only so the identity/portfolio/intelligence substrate is correct first.
