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
