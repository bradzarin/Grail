# The Grail — Product Positioning

This refines and extends the thesis in `handoff/HANDOFF.md` §1–2. That
document is preserved unmodified as the original founder handoff; this is the
current, sharper articulation of the same thesis, and the one future product
and architecture decisions should be checked against.

## The theme

**The Grail is market infrastructure for sports cards** — real-time portfolio
intelligence, market data, and transactions, in one platform.

It is explicitly **not** a collection tracker, a scanner, a pricing guide, or
a marketplace. Each of those is one piece. The Grail is the platform that
connects the pieces into a single asset lifecycle:

**Discover → Analyze → Buy → Own → Value → Grade → Track → Trade → Sell**

## Why Card Ladder / Ludex / CollX don't undermine this

Their existence is validation, not competition. Each proves collectors want
one piece of this — a price index, a scanning/tracking app, a marketplace —
badly enough to pay for or adopt it standalone. None of them span the full
lifecycle, and none combine institutional-quality market intelligence with
the actual venue where the resulting action happens. That combination is the
whitespace:

| | What it tells you |
|---|---|
| Collection apps (CollX, Ludex) | What you own |
| Pricing tools (Card Ladder) | What a card may be worth |
| Marketplaces (eBay, Fanatics Collect) | Where to transact |
| **The Grail** | **How your assets are performing — and the market to act on it, in the same place** |

A point solution can tell a collector one fact. Only a platform that owns
identity, intelligence, and the transaction can close the loop from "here's
what changed" to "here's what to do about it" without sending the collector
somewhere else to act.

## Lifecycle → current build status

Checking the actual repo against the full lifecycle, honestly:

| Stage | Status | Where |
|---|---|---|
| **Own** | Built | Collection, `POST /api/collection` (Scan+Add) |
| **Track** | Built | Home dashboard, Best Performing Cards (real unrealized gain) |
| **Value** | Built | Grail Estimate/Rating (`valuation.py`), Market Trends ticker |
| **Discover** | Partial | Market page, Suggested Pickups — catalog-only, no personalized/network discovery yet |
| **Analyze** | Partial | Grade tabs, confidence/range/market-read — no comps-table drill-down or portfolio-level analytics yet |
| **Trade** | Preview | Trade Table is a real builder over real Collection data, but only against one sample opponent — not a live matched trade between two accounts |
| **Buy / Sell** | Not built | Buttons present, intentionally inert — HANDOFF.md §17's build order defers commerce until Collection + Intelligence are excellent |
| **Grade** | Not built | No Grade Assist / submission flow yet |

This is the honest gap between the thesis and the current milestone, not a
plan to build all of it next — HANDOFF.md's build order (Collection + Market
Terminal first, commerce last) still governs sequencing. What this positioning
changes is the *frame* every future milestone gets checked against: does this
feature deepen one lifecycle stage in isolation (which competitors already
do), or does it strengthen a connection between stages (which none of them
do)? Marketplace/Trade/Grade work, when it happens, should be built so it
reads from the same Grail Estimate/Rating a collector already trusts from
Track/Value — not as a bolted-on separate product.
