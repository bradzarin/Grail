from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class CardSpec:
    """CARD_MASTER — canonical card identity. Never a user's owned copy, never a
    market observation; see docs/ARCHITECTURE.md section C for the layer split."""
    card_id: str
    query: str
    grade: str
    title: str
    sport: str
    year: str
    manufacturer: str
    product: str
    set_name: str
    player: str
    card_number: str
    team: Optional[str] = None
    parallel: Optional[str] = None
    serial_number: Optional[str] = None
    print_run: Optional[int] = None
    jersey_number: Optional[str] = None
    rookie: bool = False
    autograph: bool = False
    relic: bool = False
    # Card art is generated (js/components/CardArt.js), not photographed — real card
    # scans are the manufacturer's/photographer's copyrighted work, and the handoff
    # itself flags this (HANDOFF.md section 14/15: "use properly licensed/authorized
    # imagery in production"). These two hex colors drive that generated art.
    primary_color: str = "#6d5bff"
    secondary_color: str = "#17c3d6"
    # Editorial input to Grail Rating's Significance dimension — see valuation.py
    # and docs/ARCHITECTURE.md section J on why this is seeded, not computed.
    significance_score: int = 50
    significance_source: str = "editorial"
    population: Optional[int] = None
    population_psa10: Optional[int] = None
    population_all_graded: Optional[int] = None
    released: Optional[str] = None
    # Free-text editorial descriptors (e.g. "90s Icon", "High Liquidity") shown as
    # tags on the card page — same editorial provenance as significance_score.
    tags: tuple[str, ...] = ()


CARDS: dict[str, CardSpec] = {
    "mj-scoring-kings-5": CardSpec(
        card_id="mj-scoring-kings-5",
        query='"1993 Ultra Scoring Kings" "Michael Jordan" #5 PSA 8',
        grade="PSA 8",
        title="Michael Jordan 1993-94 Fleer Ultra Scoring Kings #5",
        sport="Basketball",
        year="1993-94",
        manufacturer="Fleer",
        product="Ultra",
        set_name="Scoring Kings",
        player="Michael Jordan",
        team="Chicago Bulls",
        card_number="5",
        jersey_number="23",
        primary_color="#CE1141",
        secondary_color="#0B0B0B",
        significance_score=92,
        population=1400,
        population_psa10=140,
        population_all_graded=4200,
        released="1993",
        tags=("90s Icon", "Insert", "Condition Sensitive", "High Liquidity"),
    ),
    "jordan-fleer-86-57": CardSpec(
        card_id="jordan-fleer-86-57",
        query='"1986 Fleer" "Michael Jordan" #57',
        grade="Raw",
        title="Michael Jordan 1986 Fleer #57 (Rookie)",
        sport="Basketball",
        year="1986",
        manufacturer="Fleer",
        product="Fleer",
        set_name="Base",
        player="Michael Jordan",
        team="Chicago Bulls",
        card_number="57",
        jersey_number="23",
        primary_color="#CE1141",
        secondary_color="#1B1B1B",
        rookie=True,
        significance_score=98,
        released="1986",
        tags=("Rookie Card", "Hobby Icon", "Key to the Set"),
    ),
    "olajuwon-fleer-86-82": CardSpec(
        card_id="olajuwon-fleer-86-82",
        query='"1986 Fleer" "Akeem Olajuwon" #82',
        grade="Raw",
        title="Akeem Olajuwon 1986 Fleer #82 (Rookie)",
        sport="Basketball",
        year="1986",
        manufacturer="Fleer",
        product="Fleer",
        set_name="Base",
        player="Akeem Olajuwon",
        team="Houston Rockets",
        card_number="82",
        jersey_number="34",
        primary_color="#BA0C2F",
        secondary_color="#FDB927",
        rookie=True,
        significance_score=93,
        released="1986",
        tags=("Rookie Card", "Hobby Icon", "Same Set as Jordan's Rookie"),
    ),
    "shaq-beam-team-7": CardSpec(
        card_id="shaq-beam-team-7",
        query='"1993-94 Fleer Ultra" "Shaquille O\'Neal" "Power in the Key" #7',
        grade="Raw",
        title="Shaquille O'Neal 1993-94 Fleer Ultra Beam Team #7 — Power in the Key",
        sport="Basketball",
        year="1993-94",
        manufacturer="Fleer",
        product="Ultra",
        set_name="Beam Team",
        player="Shaquille O'Neal",
        team="Orlando Magic",
        card_number="7",
        jersey_number="32",
        primary_color="#0077C0",
        secondary_color="#0B0B0B",
        significance_score=74,
        released="1993",
        tags=("Insert", "90s Icon"),
    ),
    "yamal-topps-chrome-auto-298": CardSpec(
        card_id="yamal-topps-chrome-auto-298",
        query='"Topps Chrome" "Lamine Yamal" rookie autograph /298',
        grade="Raw",
        title="Lamine Yamal Topps Chrome Rookie Autograph #/298",
        sport="Soccer",
        year="2024-25",
        manufacturer="Topps",
        product="Chrome",
        set_name="Base",
        player="Lamine Yamal",
        team="FC Barcelona",
        card_number="—",
        jersey_number="19",
        primary_color="#A50044",
        secondary_color="#004D98",
        parallel="Refractor",
        serial_number="/298",
        print_run=298,
        autograph=True,
        rookie=True,
        significance_score=81,
        released="2024",
        tags=("Rookie Card", "On-Card Auto", "Rising Demand"),
    ),
    "bellingham-tier-one-auto-25": CardSpec(
        card_id="bellingham-tier-one-auto-25",
        query='"Tier One" "Jude Bellingham" "Talent" autograph /25',
        grade="Raw",
        title="Jude Bellingham Tier One Talent Autograph #/25",
        sport="Soccer",
        year="2023-24",
        manufacturer="Panini",
        product="Tier One",
        set_name="Talent",
        player="Jude Bellingham",
        team="Real Madrid",
        card_number="—",
        jersey_number="5",
        primary_color="#FEBE10",
        secondary_color="#1B1B1B",
        serial_number="/25",
        print_run=25,
        autograph=True,
        significance_score=70,
        released="2023",
        tags=("Low Print Run", "On-Card Auto"),
    ),
    "messi-kaboom": CardSpec(
        card_id="messi-kaboom",
        query='"Donruss Soccer" "Kaboom" "Lionel Messi"',
        grade="Raw",
        title="Lionel Messi Panini Donruss Kaboom!",
        sport="Soccer",
        year="2023-24",
        manufacturer="Panini",
        product="Donruss",
        set_name="Kaboom!",
        player="Lionel Messi",
        team="Inter Miami CF",
        card_number="—",
        jersey_number="10",
        primary_color="#F7B5CD",
        secondary_color="#231F20",
        significance_score=85,
        released="2023",
        tags=("Insert", "Global Icon", "High Demand"),
    ),
    "ohtani-rookie": CardSpec(
        card_id="ohtani-rookie",
        query='"2018 Topps Chrome Update" "Shohei Ohtani" rookie',
        grade="Raw",
        title="Shohei Ohtani 2018 Topps Chrome Update Rookie",
        sport="Baseball",
        year="2018",
        manufacturer="Topps",
        product="Chrome Update",
        set_name="Base",
        player="Shohei Ohtani",
        team="Los Angeles Angels",
        card_number="—",
        jersey_number="17",
        primary_color="#BA0021",
        secondary_color="#003263",
        rookie=True,
        significance_score=95,
        released="2018",
        tags=("Rookie Card", "Two-Way Star", "Modern Icon"),
    ),
    "zidane-legend": CardSpec(
        card_id="zidane-legend",
        query='"Panini" "Zinedine Zidane" legends',
        grade="Raw",
        title="Zinedine Zidane Panini Legends",
        sport="Soccer",
        year="2022-23",
        manufacturer="Panini",
        product="Obsidian",
        set_name="Legends",
        player="Zinedine Zidane",
        team="Real Madrid",
        card_number="—",
        jersey_number="5",
        primary_color="#1B1B1B",
        secondary_color="#FEBE10",
        significance_score=90,
        released="2022",
        tags=("Legend", "Hobby Icon"),
    ),
    # Real 1952 Topps/Bowman checklist entries, looked up by hand via PSA's public
    # Auction Prices Realized search (psacard.com/auctionprices/search?q=...), the
    # same source used for SEED_BY_CARD — see apps/api/README.md "Card catalog scope".
    # No sales data seeded for these (none looked up yet): they render with no comps
    # until real sales are logged, same as any card added through POST /api/cards.
    "mantle-1952-topps-311": CardSpec(
        card_id="mantle-1952-topps-311",
        query='"1952 Topps" "Mickey Mantle" #311',
        grade="Raw",
        title="Mickey Mantle 1952 Topps #311",
        sport="Baseball",
        year="1952",
        manufacturer="Topps",
        product="Topps",
        set_name="Base",
        player="Mickey Mantle",
        team="New York Yankees",
        card_number="311",
        jersey_number="7",
        primary_color="#0C2340",
        secondary_color="#C4CED4",
        significance_score=99,
        significance_source="editorial",
        released="1952",
        tags=("Vintage", "Hall of Fame", "Hobby Icon", "Key to the Set"),
    ),
    "mantle-1952-bowman-101": CardSpec(
        card_id="mantle-1952-bowman-101",
        query='"1952 Bowman" "Mickey Mantle" #101',
        grade="Raw",
        title="Mickey Mantle 1952 Bowman #101",
        sport="Baseball",
        year="1952",
        manufacturer="Bowman",
        product="Bowman",
        set_name="Base",
        player="Mickey Mantle",
        team="New York Yankees",
        card_number="101",
        jersey_number="7",
        primary_color="#0C2340",
        secondary_color="#C4CED4",
        significance_score=80,
        significance_source="editorial",
        released="1952",
        tags=("Vintage", "Hall of Fame", "Alternate Manufacturer"),
    ),
    "robinson-1952-topps-312": CardSpec(
        card_id="robinson-1952-topps-312",
        query='"1952 Topps" "Jackie Robinson" #312',
        grade="Raw",
        title="Jackie Robinson 1952 Topps #312",
        sport="Baseball",
        year="1952",
        manufacturer="Topps",
        product="Topps",
        set_name="Base",
        player="Jackie Robinson",
        team="Brooklyn Dodgers",
        card_number="312",
        jersey_number="42",
        primary_color="#005A9C",
        secondary_color="#EF3E42",
        significance_score=88,
        significance_source="editorial",
        released="1952",
        tags=("Vintage", "Hall of Fame", "Historic Significance"),
    ),
    "mathews-1952-topps-407": CardSpec(
        card_id="mathews-1952-topps-407",
        query='"1952 Topps" "Ed Mathews" #407',
        grade="Raw",
        title="Ed Mathews 1952 Topps #407 (Rookie)",
        sport="Baseball",
        year="1952",
        manufacturer="Topps",
        product="Topps",
        set_name="Base",
        player="Eddie Mathews",
        team="Boston Braves",
        card_number="407",
        jersey_number="41",
        primary_color="#BD3039",
        secondary_color="#0C2340",
        rookie=True,
        significance_score=90,
        significance_source="editorial",
        released="1952",
        tags=("Rookie Card", "Vintage", "Hall of Fame", "High Number", "Last Card in Set"),
    ),
    "pafko-1952-topps-1": CardSpec(
        card_id="pafko-1952-topps-1",
        query='"1952 Topps" "Andy Pafko" #1',
        grade="Raw",
        title="Andy Pafko 1952 Topps #1",
        sport="Baseball",
        year="1952",
        manufacturer="Topps",
        product="Topps",
        set_name="Base",
        player="Andy Pafko",
        team="Brooklyn Dodgers",
        card_number="1",
        primary_color="#005A9C",
        secondary_color="#EF3E42",
        significance_score=65,
        significance_source="editorial",
        released="1952",
        tags=("Vintage", "Key to the Set", "Condition Rarity"),
    ),
}


@dataclass
class CardInstance:
    """CARD_INSTANCE — a specific owned copy. References a CARD_MASTER by id; never
    re-describes the card itself. See docs/ARCHITECTURE.md sections C and G.

    front_image/back_image match HANDOFF.md section 12's data model directly — real
    photos of this specific physical copy, uploaded via POST /api/collection/{id}/photo.
    Not frozen like CardSpec: this is mutable per-owner state, and the upload endpoint
    updates it in place. None until the owner actually uploads a photo — every card
    renders through the generated CardArt system (js/components/CardArt.js) until then,
    never a stock/borrowed image standing in for a specific real copy."""
    instance_id: str
    card_id: str
    grade: str
    acquired_price: float
    acquired_date: str
    status: str  # PC | TRADE | SELL | OPEN | PRIVATE | SOLD | PENDING
    front_image: Optional[str] = None
    back_image: Optional[str] = None


# Demo collection for a single seeded user. Phase 1 replaces this with real
# per-user persistence (docs/ARCHITECTURE.md, Milestone 2) — the shape does not change.
# Three catalog cards (Shaq, Bellingham, Zidane) are deliberately left unowned so
# Suggested Pickups has something real to recommend and the Trade Table demo has a
# sample opponent inventory, instead of both being empty/fabricated.
COLLECTION: list[CardInstance] = [
    CardInstance("inst-1", "mj-scoring-kings-5", "PSA 8", 1470.0, "2025-11-20", "PC"),
    CardInstance("inst-2", "jordan-fleer-86-57", "Raw", 3200.0, "2024-06-01", "PC"),
    CardInstance("inst-3", "yamal-topps-chrome-auto-298", "Raw", 640.0, "2025-08-02", "OPEN"),
    CardInstance("inst-4", "messi-kaboom", "Raw", 145.0, "2025-05-10", "PC"),
    CardInstance("inst-5", "ohtani-rookie", "Raw", 520.0, "2024-09-22", "PC"),
]

# Sample second collector's inventory, for the Trade Table preview only (see
# docs/ARCHITECTURE.md section I). Not a real second user/account.
OPPONENT_NAME = "Marcus T."
OPPONENT_COLLECTION: list[CardInstance] = [
    CardInstance("opp-1", "shaq-beam-team-7", "Raw", 210.0, "2025-01-14", "TRADE"),
    CardInstance("opp-2", "bellingham-tier-one-auto-25", "Raw", 890.0, "2025-03-30", "TRADE"),
    CardInstance("opp-3", "zidane-legend", "Raw", 300.0, "2025-02-02", "TRADE"),
]
