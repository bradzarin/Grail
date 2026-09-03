"""Bulk card-identity index — real checklist data, not hand-curated like the
entries in app/models.py's CARDS. Deliberately kept OUT of CARDS: main.py's
lifespan/periodic_refresh loop calls refresh() on every CARDS entry, and
Discover/Market/Grails/Suggested Pickups all iterate CARDS.values() eagerly —
merging tens of thousands of commons in there would make every one of those
slow and would flood Discover/Grails with unrated noise. Instead this stays a
separate, search-only index; app/main.py's _card_or_404 promotes an entry into
CARDS the moment someone actually opens or collects that specific card, same
as POST /api/cards already does for a hand-entered one — see
apps/api/README.md "Card catalog scope".

SOURCES is a registry, not a single hardcoded file, because this repository's
premise is "keep adding real archives as they're found" (see
apps/api/README.md "Bulk checklist" for the search that went into finding
each one — most manufacturers/sports don't have a free bulk archive at all;
this only grows when one turns up). Adding a new real source is: normalize it
into the same {year, card_number, team, player, set_name?} row shape, drop it
in app/data/, add one BulkSource entry below. No other code changes needed.

Current sources:
- topps_baseball_1952_2016.json — every Topps Baseball base card, 1952-2016
  (41,823 rows), from a community-maintained checklist archive (thirdring.net)
  that TCDB's own forum points to when asked for exactly this (TCDB itself
  has no official export — confirmed directly, and its explicit "no" to bulk
  access is why this doesn't scrape TCDB instead, despite TCDB having the
  broadest real coverage of any single site). Spot-checked against PSA's
  public Auction Prices Realized search before import (1952 #1 Andy Pafko,
  #311 Mickey Mantle, #407 Ed Mathews all matched exactly)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .cardgen import palette_for, slugify
from .models import CardSpec

DATA_DIR = Path(__file__).resolve().parent / "data"


@dataclass(frozen=True)
class BulkSource:
    path: str
    sport: str
    manufacturer: str
    product: str


SOURCES: tuple[BulkSource, ...] = (
    BulkSource(path="topps_baseball_1952_2016.json", sport="Baseball", manufacturer="Topps", product="Topps"),
)


def _load() -> dict[str, CardSpec]:
    out: dict[str, CardSpec] = {}
    for source in SOURCES:
        rows = json.loads((DATA_DIR / source.path).read_text())
        for row in rows:
            year, number = row["year"], row["card_number"]
            team, player = row.get("team"), row["player"]
            set_name = row.get("set_name") or "Base"
            # set_name only enters the id for a non-base source (e.g. a future insert-set
            # archive) — keeps existing base-set ids stable as more sources are added.
            slug_parts = [player, year, source.manufacturer]
            if set_name != "Base":
                slug_parts.append(set_name)
            slug_parts.append(number)
            card_id = slugify(*slug_parts)
            primary, secondary = palette_for(player, source.manufacturer, year)
            title_bits = [year, source.manufacturer]
            if set_name != "Base":
                title_bits.append(set_name)
            out[card_id] = CardSpec(
                card_id=card_id,
                query=f'"{year} {source.manufacturer}" "{player}" #{number}',
                grade="Raw",
                title=f"{player} {' '.join(title_bits)} #{number}",
                sport=source.sport,
                year=year,
                manufacturer=source.manufacturer,
                product=source.product,
                set_name=set_name,
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
    """Linear scan over the in-memory bulk index — a few milliseconds even at
    tens of thousands of entries, no index needed at this size. `exclude`
    holds (player, year, manufacturer, card_number) keys already covered by a
    hand-curated CARDS entry, so a vintage card researched by hand (e.g. the
    1952 Mantle) doesn't also show up as an unrated duplicate from here."""
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
