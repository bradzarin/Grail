"""The Grail Index — a portfolio-level score, structurally similar to the
per-card Grail (G) Score (app/valuation.py's grail_rating()) but measuring
genuinely different things: not an average of what a collector owns, but how
well they own it. A real brokerage account has portfolio-level metrics —
diversification, concentration risk, liquidity — that are never just an
average of each position's own rating; this is that layer for a card
collection. See docs/POSITIONING.md Pillar 2.

Five dimensions, each a rollup of real data already computed elsewhere in
this app — no new market data, no fabricated inputs:

- Caliber: cost-basis-weighted average of owned cards' real G Score composite
  (valuation.grail_rating()'s composite, always computable even without a
  Grail band). "How good is what's actually in the vault."
- Diversification: how concentrated the collection's cost basis is by sport
  and by player (a Herfindahl-style concentration index, the standard real
  measure of portfolio concentration risk), not just how many cards are
  owned.
- Liquidity: cost-basis-weighted average of owned cards' real liquidity tier
  (valuation.liquidity_profile()), rolled up to one portfolio number.
- Performance: real return — current estimated value vs. cost basis, across
  only the cards that actually have a priced estimate. Sparse data stays
  sparse here too: unpriced holdings are excluded, never treated as 0% gain.
- Depth: the one dimension no stock or crypto portfolio tool could have —
  for every player a collector owns at least one card of, what fraction of
  that player's real tracked card run (every CARDS + bulk-registry entry for
  them) do they also own, averaged across every player represented. Rewards
  actually building out a run, not just owning one card of many different
  people — the hobby side of "blend of asset and hobby" showing up in the
  analytics, not just the investment side.

Weights (an editorial choice, same category of judgment as
EDITORIAL_OVERRIDE_THRESHOLD in valuation.py, not a derived constant):
Caliber 0.25, Performance 0.20, Diversification 0.20, Depth 0.20,
Liquidity 0.15. A dimension with no computable data (e.g. Performance with
no priced holdings yet) is excluded and the remaining weights renormalize —
never silently scored as 0, which would fabricate a signal that isn't there.
"""

from __future__ import annotations

GRAIL_INDEX_VERSION = "1.0.0"

_WEIGHTS = {
    "caliber": 0.25,
    "performance": 0.20,
    "diversification": 0.20,
    "depth": 0.20,
    "liquidity": 0.15,
}

_LIQUIDITY_TIER_SCORE = {"high": 100.0, "medium": 70.0, "low": 35.0, "hold": 10.0, "unknown": 0.0}


def _hhi(weights: dict[str, float]) -> float | None:
    total = sum(weights.values())
    if total <= 0:
        return None
    return sum((w / total) ** 2 for w in weights.values())


def _caliber(items: list[dict]) -> tuple[float | None, str]:
    weighted, total_w = 0.0, 0.0
    for item in items:
        price = item["acquired_price"] or 0
        if price <= 0:
            continue
        weighted += item["card"]["rating"]["composite"] * price
        total_w += price
    if total_w <= 0:
        return None, "No cost basis recorded yet to weight this by."
    return round(weighted / total_w, 1), "Cost-basis-weighted average of every owned card's real G Score."


def _diversification(items: list[dict]) -> tuple[float | None, str]:
    sport_w: dict[str, float] = {}
    player_w: dict[str, float] = {}
    for item in items:
        price = item["acquired_price"] or 0
        if price <= 0:
            continue
        card = item["card"]
        sport_w[card["sport"]] = sport_w.get(card["sport"], 0) + price
        player_w[card["player"]] = player_w.get(card["player"], 0) + price
    hhi_sport, hhi_player = _hhi(sport_w), _hhi(player_w)
    if hhi_sport is None or hhi_player is None:
        return None, "No cost basis recorded yet to measure concentration."
    score = round((100.0 * (1 - hhi_sport) + 100.0 * (1 - hhi_player)) / 2, 1)
    note = (
        f"Cost basis spread across {len(sport_w)} sport{'s' if len(sport_w) != 1 else ''} "
        f"and {len(player_w)} player{'s' if len(player_w) != 1 else ''} — lower if concentrated "
        f"in one player or sport, regardless of total card count."
    )
    return score, note


def _liquidity(items: list[dict]) -> tuple[float | None, str]:
    weighted, total_w = 0.0, 0.0
    for item in items:
        price = item["acquired_price"] or 0
        if price <= 0:
            continue
        tier = item["card"]["liquidity"]["tier"]
        weighted += _LIQUIDITY_TIER_SCORE.get(tier, 0.0) * price
        total_w += price
    if total_w <= 0:
        return None, "No cost basis recorded yet to weight this by."
    return round(weighted / total_w, 1), "Cost-basis-weighted real trading activity across your holdings."


def _performance(items: list[dict]) -> tuple[float | None, str]:
    priced_cost, priced_value = 0.0, 0.0
    for item in items:
        est = item["card"]["estimate"]["estimate"]
        if est is None:
            continue
        priced_cost += item["acquired_price"] or 0
        priced_value += est
    if priced_cost <= 0:
        return None, "No priced holdings yet to measure real return."
    gain_pct = (priced_value - priced_cost) / priced_cost * 100
    # Dampened, not a direct +50 add like a single card's momentum score —
    # portfolio-level gains compound across months and can run far larger
    # (this demo collection is +622% on its priced holdings) than any one
    # card's short-term momentum swing, so this needs a wider scale to stay
    # meaningfully differentiated across real portfolios instead of pinning
    # at 100 for anything with a strong quarter.
    score = round(max(0.0, min(100.0, 50.0 + gain_pct / 4.0)), 1)
    sign = "+" if gain_pct >= 0 else ""
    return score, f"{sign}{round(gain_pct, 1)}% real return across priced holdings only."


def _depth(items: list[dict], cards: dict, bulk_cards: dict) -> tuple[float | None, str]:
    owned_by_player: dict[str, int] = {}
    for item in items:
        player = item["card"]["player"]
        owned_by_player[player] = owned_by_player.get(player, 0) + 1
    if not owned_by_player:
        return None, "No cards owned yet."

    universe_by_player: dict[str, int] = {}
    for c in cards.values():
        universe_by_player[c.player] = universe_by_player.get(c.player, 0) + 1
    for c in bulk_cards.values():
        universe_by_player[c.player] = universe_by_player.get(c.player, 0) + 1

    ratios = [
        min(1.0, owned_count / universe_by_player.get(player, owned_count))
        for player, owned_count in owned_by_player.items()
    ]
    score = round(100.0 * sum(ratios) / len(ratios), 1)
    note = (
        f"Averaged across the {len(owned_by_player)} player{'s' if len(owned_by_player) != 1 else ''} you collect, "
        f"against every real card of theirs this catalog tracks — owning one of six tracked cards for a player "
        f"scores lower here than owning four of six, even though both are 'one player.'"
    )
    return score, note


_BAND_THRESHOLDS = (("MASTER", 80), ("SERIOUS", 65), ("BUILDING", 45))


def _band(composite: float | None) -> str | None:
    if composite is None:
        return None
    for label, threshold in _BAND_THRESHOLDS:
        if composite >= threshold:
            return label
    return "STARTER"


def grail_index(items: list[dict], cards: dict, bulk_cards: dict) -> dict:
    """items: output of main.get_collection() (already-joined instance+card
    summaries, same shape portfolio.breakdown() consumes). cards/bulk_cards:
    CARDS and BULK_CARDS, passed in rather than imported to keep this module
    free of any dependency on how the caller sources the real-card universe."""
    caliber, caliber_note = _caliber(items)
    diversification, div_note = _diversification(items)
    liquidity, liq_note = _liquidity(items)
    performance, perf_note = _performance(items)
    depth, depth_note = _depth(items, cards, bulk_cards)

    dims = {
        "caliber": caliber,
        "performance": performance,
        "diversification": diversification,
        "depth": depth,
        "liquidity": liquidity,
    }
    present = {k: v for k, v in dims.items() if v is not None}
    if present:
        total_w = sum(_WEIGHTS[k] for k in present)
        composite = round(sum(_WEIGHTS[k] * v for k, v in present.items()) / total_w, 1)
    else:
        composite = None

    return {
        "version": GRAIL_INDEX_VERSION,
        "composite": composite,
        "band": _band(composite),
        "dimensions": {
            "caliber": {"score": caliber, "note": caliber_note},
            "performance": {"score": performance, "note": perf_note},
            "diversification": {"score": diversification, "note": div_note},
            "depth": {"score": depth, "note": depth_note},
            "liquidity": {"score": liquidity, "note": liq_note},
        },
    }
