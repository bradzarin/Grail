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
  #311 Mickey Mantle, #407 Ed Mathews all matched exactly).
- panini_origins_basketball_2025_26.json — every card (base, inserts,
  parallels, autos) in 2025-26 Panini Origins Basketball, 5,277 rows including
  print runs, straight from Panini's own downloadable checklist CSV for the
  product (they publish one of these per release — confirms Panini does
  provide free structured checklists directly, just per-product rather than
  as a historical bulk archive).
- topps_uefa_club_competitions_2022_23.json — every card in 2022-23 Topps
  UEFA Club Competitions Soccer (425 rows: base, inserts, autographs), from
  Beckett News's own downloadable XLSX checklist embedded in their free
  article (beckett.com/news/2022-23-topps-uefa-club-collections) — Beckett
  publishes one of these, often with a matching XLSX download, for
  essentially every notable release they cover, across every sport, going
  back years. That's a real, large, systematically-structured, free source
  this repository hadn't tapped until a user found one directly and pointed
  it out.
- topps_chrome_football_2025.json — every card in 2025 Topps Chrome Football
  (1,926 rows across 37 real subsets: base, rookies, seven autograph
  families, relics, and dozens of named insert sets), from Beckett News's
  downloadable XLSX (beckett.com/news/2025-topps-chrome-football-cards).
- opeechee_hockey_2025_26.json — every card in 2025-26 O-Pee-Chee Hockey
  (909 rows across 17 real subsets: base, 4 Nations Face-Off, Marquee
  Rookies, several photo-variation parallels, and named inserts), from
  Beckett News's downloadable XLSX
  (beckett.com/news/2025-26-o-pee-chee-hockey-cards). First hockey coverage
  in this registry.
- upperdeck_golf_2024.json — every card in 2024 Upper Deck Golf (649 rows
  across 19 real subsets), from Beckett News's downloadable XLSX
  (beckett.com/news/2024-upper-deck-golf-cards). First golf coverage.
- panini_prizm_nascar_2025.json — every card in 2025 Panini Prizm NASCAR
  Racing (495 rows across 14 real subsets), from Beckett News's downloadable
  XLSX (beckett.com/news/2025-panini-prizm-nascar-racing-cards). First
  racing coverage.
- panini_select_wwe_2023.json — every card in 2023 Panini Select WWE (790
  rows across 16 real subsets — base tiered by arena level, autographed
  memorabilia, several signature families), from Beckett News's downloadable
  XLSX (beckett.com/news/2023-panini-select-wwe-wrestling-cards). First
  wrestling coverage — added "Wrestling" to js/grades.js's SPORTS list to
  match.

All of the Beckett-sourced entries above follow the same per-sheet parsing
pattern (a "N cards" line marks each real subset's start; app/data/ holds
only the normalized {year, card_number, team, player, set_name, rookie,
autograph} rows, not the original files or any of Beckett's own article
text) — see apps/api/README.md "Bulk checklist" for what's worth pulling
next from the same place."""

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
    BulkSource(
        path="panini_origins_basketball_2025_26.json",
        sport="Basketball",
        manufacturer="Panini",
        product="Origins (25-26)",
    ),
    BulkSource(
        path="topps_uefa_club_competitions_2022_23.json",
        sport="Soccer",
        manufacturer="Topps",
        product="UEFA Club Competitions",
    ),
    BulkSource(path="topps_chrome_football_2025.json", sport="Football", manufacturer="Topps", product="Chrome"),
    BulkSource(
        path="opeechee_hockey_2025_26.json",
        sport="Hockey",
        manufacturer="O-Pee-Chee",
        product="O-Pee-Chee",
    ),
    BulkSource(path="upperdeck_golf_2024.json", sport="Golf", manufacturer="Upper Deck", product="Upper Deck"),
    BulkSource(
        path="panini_prizm_nascar_2025.json",
        sport="Racing",
        manufacturer="Panini",
        product="Prizm",
    ),
    BulkSource(
        path="panini_select_wwe_2023.json",
        sport="Wrestling",
        manufacturer="Panini",
        product="Select",
    ),
)


def _load() -> dict[str, CardSpec]:
    out: dict[str, CardSpec] = {}
    for source in SOURCES:
        rows = json.loads((DATA_DIR / source.path).read_text())
        for row in rows:
            year, number = row["year"], row["card_number"]
            team, player = row.get("team"), row["player"]
            set_name = row.get("set_name") or "Base"
            # set_name only enters the id for a non-base source (e.g. an insert-set
            # row) — keeps existing base-set ids stable as more sources are added.
            slug_parts = [player, year, source.manufacturer]
            if set_name != "Base":
                slug_parts.append(set_name)
            slug_parts.append(number)
            card_id = slugify(*slug_parts)
            # Seeded on set_name + number, not just player/manufacturer/year — a
            # product with many real cards for the same player in the same year
            # (base, inserts, autographs, parallel tiers) needs each to look like a
            # distinct card in a grid, not the same color repeated.
            primary, secondary = palette_for(player, source.manufacturer, year, set_name, number)
            # Some sources' set_name already spells out the year and/or manufacturer
            # (Panini's CARD SET column reads like "2025 Panini Court Kings Basketball
            # - Flawless Focus"; O-Pee-Chee's insert names repeat the brand, e.g.
            # "O-Pee-Chee Premier") — only prepend whichever of year/manufacturer isn't
            # already in there, so titles don't duplicate either.
            bits = []
            if set_name == "Base" or not set_name.startswith(year):
                bits.append(year)
            if set_name == "Base" or source.manufacturer.lower() not in set_name.lower():
                bits.append(source.manufacturer)
            if set_name != "Base":
                bits.append(set_name)
            descriptor = " ".join(bits)
            print_run = row.get("print_run")
            out[card_id] = CardSpec(
                card_id=card_id,
                query=f'"{year} {source.manufacturer}" "{player}" #{number}',
                grade="Raw",
                title=f"{player} {descriptor} #{number}",
                sport=source.sport,
                year=year,
                manufacturer=source.manufacturer,
                product=source.product,
                set_name=set_name,
                player=player,
                team=team,
                card_number=number,
                serial_number=f"/{print_run}" if print_run else None,
                print_run=print_run,
                rookie=bool(row.get("rookie")),
                autograph=bool(row.get("autograph")),
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
