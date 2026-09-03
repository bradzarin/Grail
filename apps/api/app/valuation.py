"""Derived analytics — Grail Estimate and Grail Rating.

Pure functions over CARD_MASTER + transaction-level sales. Never persisted as if it
were a transaction (HANDOFF.md section 6); always recomputed, always carries a
confidence/derivation note. See docs/ARCHITECTURE.md sections C and J.
"""

from __future__ import annotations

import math
import statistics
from datetime import datetime, timedelta, timezone

GRAIL_RATING_VERSION = "1.1.0"
EDITORIAL_OVERRIDE_THRESHOLD = 90


def _parse(date_str: str) -> datetime:
    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def grail_estimate(sales_rows: list[dict], as_of: datetime | None = None) -> dict:
    """sales_rows: rows from db.sales(), ordered oldest -> newest.

    as_of: pretend "now" is this moment instead of the real current time —
    used to replay what the estimate would have been at a past date (see
    portfolio.py's performance-over-time reconstruction). Callers doing that
    must also pre-filter sales_rows to sold_at <= as_of themselves; this
    function only uses as_of as the anchor for the 30D/90D windows.
    """
    if not sales_rows:
        return {
            "estimate": None,
            "range_low": None,
            "range_high": None,
            "confidence": "LOW",
            "last_sale": None,
            "avg_30d": None,
            "avg_90d": None,
            "sale_count_90d": 0,
            "sale_count_total": 0,
            "insufficient_data": True,
            "market_read": "No completed sales recorded yet — estimate unavailable.",
        }

    now = as_of or datetime.now(timezone.utc)
    parsed = [(r, _parse(r["sold_at"])) for r in sales_rows]
    parsed.sort(key=lambda t: t[1])

    def window(days):
        cutoff = now - timedelta(days=days)
        return [r for r, d in parsed if d >= cutoff]

    last_row, _ = parsed[-1]
    prices = [r["price"] for r, _ in parsed]
    w30, w90 = window(30), window(90)
    avg_30d = round(statistics.mean(p["price"] for p in w30), 2) if w30 else None
    avg_90d = round(statistics.mean(p["price"] for p in w90), 2) if w90 else None

    recent = prices[-min(8, len(prices)):]
    estimate = round(statistics.mean(recent), 2)
    spread = statistics.pstdev(recent) if len(recent) > 1 else estimate * 0.12
    range_low = round(max(0, estimate - spread), 2)
    range_high = round(estimate + spread, 2)

    count_90d = len(w90)
    if count_90d >= 5:
        confidence = "HIGH"
    elif count_90d >= 1 or len(prices) >= 3:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    momentum_pct = None
    if len(prices) >= 4:
        mid = len(prices) // 2
        early, late = prices[:mid], prices[mid:]
        early_avg, late_avg = statistics.mean(early), statistics.mean(late)
        if early_avg:
            momentum_pct = round((late_avg - early_avg) / early_avg * 100, 1)

    read_parts = [f"{len(prices)} completed sale{'s' if len(prices) != 1 else ''} on record"]
    if count_90d:
        read_parts.append(f"{count_90d} in the last 90 days")
    if momentum_pct is not None:
        direction = "up" if momentum_pct >= 0 else "down"
        read_parts.append(f"price trending {direction} {abs(momentum_pct)}% vs the earlier period")

    return {
        "estimate": estimate,
        "range_low": range_low,
        "range_high": range_high,
        "confidence": confidence,
        "last_sale": {"price": last_row["price"], "date": last_row["sold_at"], "venue": last_row["venue"]},
        "avg_30d": avg_30d,
        "avg_90d": avg_90d,
        "sale_count_90d": count_90d,
        "sale_count_total": len(prices),
        "insufficient_data": False,
        "momentum_pct": momentum_pct,
        "market_read": "; ".join(read_parts) + ".",
    }


def liquidity_profile(estimate: dict) -> dict:
    """How actively this card actually trades, not just what it's worth — a
    "hold in the collection" card and an actively-traded one can carry the same
    estimate but very different market character. Derived purely from real
    90D sale count already computed above; never a separate guess."""
    if estimate["insufficient_data"]:
        return {"tier": "unknown", "label": "Unrated", "note": "No completed sales yet to characterize liquidity."}
    n = estimate["sale_count_90d"]
    if n >= 8:
        tier, label = "high", "Actively Traded"
    elif n >= 3:
        tier, label = "medium", "Regularly Traded"
    elif n >= 1:
        tier, label = "low", "Thinly Traded"
    else:
        tier, label = "hold", "Hold — Infrequent Sales"
    return {
        "tier": tier,
        "label": label,
        "note": f"{n} sale{'s' if n != 1 else ''} in the last 90 days.",
    }


def _money(v: float) -> str:
    return f"${v:,.0f}"


def market_commentary(card, estimate: dict) -> str:
    """The card-page write-up. Every sentence is conditioned on a real computed
    number or a curated tag — never a fixed template that reads the same
    regardless of the actual card and market. See handoff/HANDOFF.md section 6
    ("no fake precision") — this extends that discipline to prose, not just
    the headline number."""
    kind_bits = [b for b, flag in (("rookie card", card.rookie), ("on-card autograph", card.autograph), ("relic card", card.relic)) if flag]
    kind = ", ".join(kind_bits) if kind_bits else "card"
    serial = f" numbered {card.serial_number}" if card.serial_number else ""
    parallel = f"{card.parallel} " if card.parallel else ""
    identity = (
        f"The {card.title} is a {card.year} {card.manufacturer} {card.product} {kind}{serial} "
        f"from the {card.set_name} {parallel}line."
    )

    if estimate["insufficient_data"]:
        return (
            f"{identity} No completed sales have been recorded yet at {card.grade}, so The Grail shows "
            f"that plainly rather than guessing — log a comp you've found yourself, or check back as the "
            f"market accumulates."
        )

    sentences = [identity]

    spread_pct = (estimate["range_high"] - estimate["range_low"]) / estimate["estimate"] * 100 if estimate["estimate"] else None
    condition_sensitive = "Condition Sensitive" in card.tags or (spread_pct is not None and spread_pct > 25)
    if estimate["sale_count_total"] < 3:
        # Too few sales for "tight" or "settled" to be an honest read of the
        # market — the range here is mostly a statistical fallback (see
        # grail_estimate's spread calc), not an observed spread. Say so.
        sentences.append(
            f"Only {estimate['sale_count_total']} completed sale{'s' if estimate['sale_count_total'] != 1 else ''} "
            f"{'are' if estimate['sale_count_total'] != 1 else 'is'} on record at {card.grade}, so the range shown "
            f"is a wider statistical estimate rather than a tightly observed spread — treat it as a starting point."
        )
    elif spread_pct is not None:
        if condition_sensitive:
            sentences.append(
                f"Recent {card.grade} sales ranged from {_money(estimate['range_low'])} to "
                f"{_money(estimate['range_high'])} — condition and eye appeal drive real price separation "
                f"on this card, so the range matters as much as the midpoint."
            )
        else:
            sentences.append(
                f"Recent {card.grade} sales have clustered tightly ({_money(estimate['range_low'])}–"
                f"{_money(estimate['range_high'])}), suggesting the market has largely settled on this "
                f"card's value at this grade."
            )

    if estimate["momentum_pct"] is not None:
        direction = "trending up" if estimate["momentum_pct"] >= 0 else "trending down"
        if estimate["sale_count_90d"] > 0:
            confidence_basis = (
                f"{estimate['confidence'].lower()} confidence from {estimate['sale_count_90d']} sale"
                f"{'s' if estimate['sale_count_90d'] != 1 else ''} in the last 90 days"
            )
        else:
            confidence_basis = (
                f"{estimate['confidence'].lower()} confidence from {estimate['sale_count_total']} sales on "
                f"record, though none in the last 90 days"
            )
        sentences.append(
            f"The {card.grade} market is {direction} {abs(estimate['momentum_pct'])}% across the sales on "
            f"record, with {confidence_basis}."
        )
    else:
        sentences.append(
            f"There isn't enough sales volume yet to confirm a trend direction — "
            f"{estimate['confidence'].lower()} confidence reflects that, not a hidden number."
        )

    sentences.append(
        "The Grail shows a likely range and confidence level alongside the price history rather than "
        "presenting one number as if it were exact."
    )
    return " ".join(sentences)


def _value_score(price: float | None) -> float:
    if not price or price <= 0:
        return 0.0
    return max(0.0, min(100.0, 20.0 * math.log10(price)))


def _demand_score(sale_count_90d: int) -> float:
    return max(0.0, min(100.0, sale_count_90d * 15.0))


def _scarcity_score(print_run: int | None, population: int | None) -> float:
    if print_run:
        return max(10.0, min(100.0, 100.0 - min(90.0, print_run / 5.0)))
    if population:
        return max(10.0, min(100.0, 100.0 - min(90.0, population / 50.0)))
    return 40.0  # unknown supply — neutral-low, not fabricated scarcity


def _momentum_score(momentum_pct: float | None) -> float:
    if momentum_pct is None:
        return 40.0  # not enough sales to confirm acceleration either way
    return max(0.0, min(100.0, 50.0 + momentum_pct))


def grail_rating(card, estimate: dict) -> dict:
    """card: models.CardSpec. estimate: output of grail_estimate()."""
    price = estimate["estimate"] or None
    value = _value_score(price)
    demand = _demand_score(estimate["sale_count_90d"])
    scarcity = _scarcity_score(card.print_run, card.population)
    significance = float(card.significance_score)
    momentum = _momentum_score(estimate.get("momentum_pct"))

    composite = round(
        0.25 * value + 0.25 * demand + 0.20 * scarcity + 0.20 * significance + 0.10 * momentum,
        1,
    )

    if composite >= 90:
        band, band_source = "GRAIL", "composite"
    elif composite >= 80:
        band, band_source = "ELITE", "composite"
    elif composite >= 70:
        band, band_source = "NOTABLE", "composite"
    elif significance >= EDITORIAL_OVERRIDE_THRESHOLD:
        # Spec override path (MARKETPLACE_TRADE_AUCTION_SPEC.md, "Grail Rating
        # definition direction"): a historically important card can qualify on
        # significance alone even with too little market data to earn it on
        # the composite. Capped at ELITE, never the market-driven GRAIL band,
        # and always flagged so the override is auditable, not silently blended in.
        band, band_source = "ELITE", "editorial_override"
    else:
        band, band_source = None, "composite"

    return {
        "version": GRAIL_RATING_VERSION,
        "composite": composite,
        "band": band,
        "band_source": band_source,
        "dimensions": {
            "value": round(value, 1),
            "demand": round(demand, 1),
            "scarcity": round(scarcity, 1),
            "significance": round(significance, 1),
            "momentum": round(momentum, 1),
        },
        "significance_source": card.significance_source,
    }
