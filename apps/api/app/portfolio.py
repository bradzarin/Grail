"""Portfolio-level analytics — the Robinhood/Coinbase-style lens on top of the
same per-card Grail Estimate everything else uses. See docs/POSITIONING.md:
The Grail should let a collector read their holdings by card, by sport, by
player, or as one portfolio, the way a brokerage app reads a stock/crypto
portfolio. Nothing here is a separate data source — it's the same
`grail_estimate()` replayed at different dates and grouped differently.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .db import sales as sales_rows
from .valuation import grail_estimate


def _parse_date(s: str) -> datetime:
    return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)


def performance_series(collection, cards) -> list[dict]:
    """Reconstructed total portfolio value over time.

    At each checkpoint date, a card counts toward the total only if it was
    already acquired (acquired_date <= checkpoint) and only using sales that
    had actually happened by then (sold_at <= checkpoint) — the same
    grail_estimate() logic every card page uses, just replayed as of an
    earlier moment, so this is a real reconstruction, not a fabricated trend
    line. A card with no sales yet as of a checkpoint simply doesn't
    contribute (sparse data stays sparse), so total_value can legitimately
    be null before anything in the collection had a priced sale.
    """
    owned = [inst for inst in collection if inst.card_id in cards]
    if not owned:
        return []

    per_card_rows = {inst.card_id: sales_rows(inst.card_id, inst.grade) for inst in owned}

    checkpoints = sorted({
        row["sold_at"]
        for rows in per_card_rows.values()
        for row in rows
    })
    if not checkpoints:
        return []

    series = []
    for checkpoint in checkpoints:
        as_of = _parse_date(checkpoint).replace(hour=23, minute=59, second=59)
        total = 0.0
        priced_count = 0
        for inst in owned:
            if inst.acquired_date > checkpoint:
                continue
            rows_to_date = [r for r in per_card_rows[inst.card_id] if r["sold_at"] <= checkpoint]
            est = grail_estimate(rows_to_date, as_of=as_of)
            if est["estimate"] is not None:
                total += est["estimate"]
                priced_count += 1
        if priced_count:
            series.append({"date": checkpoint, "total_value": round(total, 2), "priced_count": priced_count})

    return series


def breakdown(items, group_by: str) -> list[dict]:
    """items: output of main.get_collection() (already-joined instance+card
    summaries). group_by: 'sport' or 'player'. Ranked by total_value desc."""
    groups: dict[str, dict] = {}
    for item in items:
        card = item["card"]
        key = card.get(group_by)
        if not key:
            continue
        g = groups.setdefault(key, {"key": key, "card_count": 0, "cost_basis": 0.0, "priced_cost_basis": 0.0, "total_value": 0.0, "priced_count": 0})
        g["card_count"] += 1
        g["cost_basis"] += item["acquired_price"]
        est = card["estimate"]["estimate"]
        if est is not None:
            g["total_value"] += est
            g["priced_cost_basis"] += item["acquired_price"]
            g["priced_count"] += 1

    out = []
    for g in groups.values():
        gain_pct = None
        if g["priced_cost_basis"] > 0:
            gain_pct = round((g["total_value"] - g["priced_cost_basis"]) / g["priced_cost_basis"] * 100, 1)
        out.append({
            "key": g["key"],
            "card_count": g["card_count"],
            "priced_count": g["priced_count"],
            "cost_basis": round(g["cost_basis"], 2),
            "total_value": round(g["total_value"], 2) if g["priced_count"] else None,
            "gain_pct": gain_pct,
        })
    out.sort(key=lambda g: g["total_value"] or -1, reverse=True)
    return out
