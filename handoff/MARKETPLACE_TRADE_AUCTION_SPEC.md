# THE GRAIL — MARKETPLACE / AUCTION / TRADE PRODUCT SPEC
Version: 2026-09-02

## Strategic role
Marketplace, auctions and trades are not an optional add-on. They are the transaction layer of the same system that begins with the Collection and Market Intelligence layers.

The product loop is:
**Own → Understand → Discover → Negotiate → Trade/Buy/Sell → Verify → Settle → Update the market graph.**

The Grail should eliminate the current card-show/eBay workflow of price stickers, ad-hoc phone searches, opaque comps and subjective negotiation. A buyer and seller should be able to see the same transparent market context while still preserving the human/passion element of the Hobby.

## Marketplace north star
A card should not have to be relisted into a disconnected marketplace object to become actionable. A Card Instance in a user's Collection can carry an availability state:
- PC / NOT AVAILABLE
- OPEN TO OFFERS
- TRADE
- SELL
- AUCTION
- PRIVATE
- PENDING
- SOLD / TRADED

This turns the ownership graph into marketplace inventory with user permission.

## Core marketplace surfaces
### 1. Market Home
- Search by player, card, year, set, parallel, serial/numbered, autograph, relic, grade, grader and team.
- Live/recent movers.
- Most traded / most wanted.
- New Grails.
- Auctions ending soon.
- Cards with high bid/ask activity.
- Cards available for trade.
- Personalized opportunities based on Collection + Wants.

### 2. Card Market Page
One canonical card identity, many actionable instances.
- Market ticker and completed-sales history.
- Raw/grade tabs.
- Active Buy Now listings.
- Current auctions.
- Highest verified offer / lowest verified ask when appropriate.
- Copies available for trade.
- Number of collectors who own / want the card (privacy-safe aggregate).
- Population / print run / serial scarcity.
- Grade spread.
- Grail Rating.
- BUY / OFFER / TRADE actions.

### 3. Auction Room
- Current bid and bid history.
- Market estimate/range visible beside auction price.
- Market alignment: auction price vs recent verified market.
- Watch / bid / max bid.
- Anti-sniping extension.
- Seller reputation and card verification.
- High-value authentication/escrow workflow.
- Clear buyer/seller fees before commitment.

### 4. Trade Table
This is a signature product surface.
- YOU vs THEM.
- Drag cards from each user's Trade Box / Collection.
- Optional cash on either side.
- Real-time market estimate of each side.
- Market alignment percentage/range.
- Difference and confidence.
- Each card can expand into its market ticker without leaving negotiation.
- Add/remove/counter/accept/decline.
- Both parties see the same underlying comp methodology.
- Market values are informational; users remain free to value passion/PC cards differently.

### 5. Card-show / In-person Mode (important future feature)
- Mobile-first quick lookup/scan.
- Scan a slab/raw card or search exact card.
- Immediate last sales, range, grade spread, liquidity and Grail Rating.
- QR/NFC or short code to open a proposed trade.
- Build a trade on the table in seconds.
- Optional instant verified transaction record so the completed trade improves future market data.

## Transparency architecture
The Grail should create a shared factual layer without pretending every card has a single objective price.

For every transaction context show:
- Grail Estimate.
- Likely Market Range.
- Last verified sale.
- 30D/90D average.
- Sales count/liquidity.
- High/low.
- Grade and condition context.
- Source freshness.
- Confidence.
- Market Read.

For high-value transactions add:
- Authentication status.
- Cert verification.
- Serial-number check.
- Provenance where available.
- Seller/trader reputation.
- Payment/escrow status.
- Shipping/custody status.

## Auction rules direction
- Reserve optional, visibly disclosed.
- Proxy/max bidding.
- Anti-sniping: extend auction if qualifying bid arrives in final window; exact rule configurable.
- Immutable bid audit log.
- Seller cannot bid on own auction; related-account risk checks.
- Soft-close logic must be deterministic and visible.
- High-value threshold can require enhanced verification/authentication.
- Completed auction writes a verified market observation after settlement, not merely at hammer if transaction fails.

## Offer / negotiation direction
- Offer expiration.
- Counteroffers.
- Optional message/note.
- Market-context snapshot stored with offer so later changes do not rewrite what parties saw.
- Prevent accidental double-sale by reserving instance when an offer is accepted.
- State machine controls cancellation, payment, authentication, shipping and settlement.

## Trade state machine
DRAFT → PROPOSED → COUNTERED → ACCEPTED → LOCKED → AUTHENTICATION (if required) → SHIPPING/CUSTODY → SETTLED → COMPLETE
Failure branches: DECLINED / EXPIRED / CANCELLED / DISPUTED / FAILED_AUTH / FAILED_PAYMENT.

On ACCEPTED:
- Freeze card-instance availability.
- Snapshot market estimates and sources.
- Confirm ownership/identity requirements.
- Calculate cash component/fees.
- Route high-value cards through authentication/escrow policy.

On COMPLETE:
- Transfer Card Instance ownership in the Grail graph (or create provenance event if external custody model).
- Record transaction/trade consideration.
- Update reputation.
- Add verified transaction observation to market graph where valuation methodology supports it.

## Grail Rating definition direction
A card can earn the G mark because it is economically important OR culturally/collector important.

Dimensions, each scored 0–100:
- Value Score — market value percentile / absolute tier.
- Demand Score — transaction velocity, watch/want activity, bid depth.
- Scarcity Score — print run, serial, population, supply-to-demand.
- Significance Score — iconic rookie/insert/set/player/era status.
- Momentum Score — confirmed price/demand acceleration with sufficient volume.

Suggested composite starting point (tunable, not final):
GrailScore = 0.25*Value + 0.25*Demand + 0.20*Scarcity + 0.20*Significance + 0.10*Momentum

Potential bands:
- G90–100: GRAIL / ICON
- G80–89: ELITE
- G70–79: NOTABLE
- Below 70: no G badge by default

Override path: editorial/iconic designation can qualify a historically important card even if price/velocity is below threshold. Any override should be transparent in internal audit data.

## Marketplace safety / trust
- Identity verification tiers.
- Age-aware/parent-controlled junior accounts.
- Card ownership evidence for high-value listings/trades.
- Cert lookup and duplicate-cert detection.
- Serial-number tracking.
- Image fingerprinting / duplicate listing detection.
- Fraud/device/payment risk signals.
- Reputation based on completed behavior, not only star ratings.
- Dispute process.
- High-value escrow/authentication/custody path.

## Fee architecture — product requirement, pricing TBD
The UI/API should support configurable fees rather than hardcoding today's assumptions:
- Seller transaction fee (%).
- Buyer fee if ever used.
- Fee cap.
- Subscription-tier discounts.
- Fixed protected-trade fee.
- Authentication fee.
- Shipping fee/margin.
- Trade + cash: percentage fee should generally apply to cash consideration, not arbitrary imputed value of the exchanged cards.

## Marketplace data objects
- Listing
- Auction
- Bid
- Offer
- TradeProposal
- TradeLeg / TradeItem
- CashAdjustment
- Watch
- Want
- MarketSnapshot
- FeeQuote
- AuthenticationOrder
- Shipment/CustodyEvent
- Settlement
- Dispute
- ReputationEvent
- ProvenanceEvent

## Analytics created by commerce
The marketplace should improve research:
- Bid depth.
- Bid/ask spread.
- Offer-to-sale conversion.
- Days to sale.
- Trade frequency.
- Want/own ratio.
- Number of active copies.
- Auction clearance rate.
- Price elasticity by grade.
- Liquidity by card/grade.
- Realized trade consideration where reliably measurable.

## UX principle
Never force the advanced data onto a young/new collector. Use progressive disclosure:
Level 1: image + value/range + G badge + simple action.
Level 2: chart + recent sales + liquidity + grade context.
Level 3: source-level comps, population, spread, volatility, auction/bid history and methodology.
