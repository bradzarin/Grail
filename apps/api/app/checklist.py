"""Bulk card-identity index — real checklist data, not hand-curated like the
entries in app/models.py's CARDS. Deliberately kept OUT of CARDS: main.py's
lifespan/periodic_refresh loop calls refresh() on every CARDS entry, and
Discover/Market/Grails/Suggested Pickups all iterate CARDS.values() eagerly —
merging ~42,000 commons in there would make every one of those slow and would
flood Discover/Grails with unrated noise. Instead this stays a separate,
search-only index; app/main.py's _card_or_404 promotes an entry into CARDS the
moment someone actually opens or collects that specific card, same as
POST /api/cards already does for a hand-entered one — see
apps/api/README.md "Card catalog scope".

Source: apps/api/app/data/topps_baseball_1952_2016.json — every Topps Baseball
base card, 1952-2016 (41,823 rows), Number/Team/Player, downloaded from a
community-maintained checklist site (thirdring.net) that TCDB's own forum
points to when asked for exactly this ("Exportable Complete Checklists"
thread — TCDB itself has no official export). Spot-checked against PSA's
public Auction Prices Realized search before import; matches exactly (e.g.
1952 Topps #1 Andy Pafko, #311 Mickey Mantle, #407 Ed Mathews)."""

from __future__ import annotations

import json
from pathlib import Path

from .cardgen import palette_for, slugify
from .models import CardSpec

DATA_PATH = Path(__file__).resolve().parent / "data" / "topps_baseball_1952_2016.json"


def _load() -> dict[str, CardSpec]:
    rows = json.loads(DATA_PATH.read_text())
    out: dict[str, CardSpec] = {}
    for row in rows:
        year, number, team, player = row["year"], row["card_number"], row.get("team"), row["player"]
        card_id = slugify(player, year, "topps", number)
        primary, secondary = palette_for(player, "topps", year)
        out[card_id] = CardSpec(
            card_id=card_id,
            query=f'"{year} Topps" "{player}" #{number}',
            grade="Raw",
            title=f"{player} {year} Topps #{number}",
            sport="Baseball",
            year=year,
            manufacturer="Topps",
            product="Topps",
            set_name="Base",
            player=player,
            team=team,
            card_number=number,
            primary_color=primary,
            secondary_color=secondary,
            significance_score=50,
            significance_source="editorial",
            released=year,
            tags=("Vintage",) if year.isdigit() and int(year) < 1980 else (),
        )
    return out


BULK_CARDS: dict[str, CardSpec] = _load()


def search_bulk(query: str, limit: int = 50, exclude: set[tuple] = frozenset()) -> list[CardSpec]:
    """Linear scan over ~42k in-memory dataclasses — a few milliseconds, no
    index needed at this size. `exclude` holds (player, year, manufacturer,
    card_number) keys already covered by a hand-curated CARDS entry, so a
    vintage card researched by hand (e.g. the 1952 Mantle) doesn't also show
    up as an unrated duplicate from this bulk index."""
    q = query.strip().lower()
    if not q:
        return []
    terms = q.split()
    results = []
    for card in BULK_CARDS.values():
        key = (card.player.lower(), card.year, card.manufacturer.lower(), card.card_number)
        if key in exclude:
            continue
        haystack = f"{card.player} {card.year} {card.team or ''} {card.card_number}".lower()
        if all(t in haystack for t in terms):
            results.append(card)
    results.sort(key=lambda c: (c.player.lower() != q, c.year))
    return results[:limit]
