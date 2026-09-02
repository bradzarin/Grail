You are taking over development of **The Grail**, a collector-first sports-card operating system and future marketplace.

Before writing code:
1. Read `HANDOFF.md` completely.
2. Inspect `assets/preferred_interface_reference.png`.
3. Run `prototypes/collector_home_v3.html`.
4. Run `prototypes/mj_scoring_kings_terminal.html`.
5. Read `market_engine/grail_market_live/README.md` and inspect the source adapters/API.
6. Inspect `assets/the_grail_logo.png` and the local card assets.

Your task is to convert the strongest work in this handoff into a production-oriented web application without losing the product thesis or visual direction.

NON-NEGOTIABLES:
- Collection-first, not listing-first.
- White/light premium canvas; cards provide most color.
- No generic AI-dashboard or dark sci-fi aesthetic.
- Card imagery must never rely on brittle random external URLs.
- Every card detail must support transparent market intelligence.
- Market trend x-axis must be true calendar time for 30D/90D/1Y/2Y.
- Transaction charts use actual completed sales; do not interpolate fake monthly/daily prices.
- Sparse data remains sparse.
- Show estimate + range + evidence + confidence, not fake precision.
- Keep original venue/source/auditability for market observations.
- The Grail Rating is based on value, demand, scarcity, significance and momentum.
- The product must be approachable for a child/new collector and useful for a sophisticated collector/dealer.
- Do not start by building auctions/payments. First make Collection + Card Terminal + Scan/Add excellent.

FIRST DEVELOPMENT MILESTONE:
Build a responsive, production-quality Collection Home and Card Market Terminal using a real component architecture. Reproduce the preferred reference's hierarchy and spacing while improving accessibility/responsiveness. Wire the Market Terminal to the included API scaffold. Use local included card assets for the demo. Add loading/error/empty states and a robust image fallback.

Before implementing, return:
A. proposed repo structure,
B. component map,
C. data model/API map,
D. first 3 milestones,
E. any issues you found in the existing scaffold.

Then implement Milestone 1.


MARKETPLACE CONTEXT UPDATE:
Read `MARKETPLACE_TRADE_AUCTION_SPEC.md` and `marketplace_code/` before finalizing architecture. The marketplace/trade/auction universe is a cornerstone of the end-state, even though Milestone 1 remains Collection + Market Terminal. Your architecture must not paint the project into a corner: Card Instance availability, market snapshots, provenance, offers, auctions, trades, trade+cash, authentication and settlement need clean future extension points.

Add to your initial architecture response:
F. Marketplace domain boundaries and state machines,
G. how Collection Card Instances become actionable marketplace inventory without duplicating card identity,
H. how a completed settled transaction feeds the verified market-data graph,
I. how the Trade Table can drill into card analytics in-place,
J. how the G/Grail Rating will be computed and versioned.
