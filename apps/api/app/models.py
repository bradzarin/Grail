from __future__ import annotations

from dataclasses import dataclass, field
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
    rookie: bool = False
    autograph: bool = False
    relic: bool = False
    front_image: str = ""
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
        front_image="/static/assets/cards/mj_scoring_kings_actual.png",
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
        rookie=True,
        front_image="/static/assets/cards/michael_jordan_fleer.jpg",
        significance_score=98,
        released="1986",
        tags=("Rookie Card", "Hobby Icon", "Key to the Set"),
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
        front_image="/static/assets/cards/shaq_beam_team.jpg",
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
        parallel="Refractor",
        serial_number="/298",
        print_run=298,
        autograph=True,
        rookie=True,
        front_image="/static/assets/cards/lamine_yamal_auto_298.jpg",
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
        serial_number="/25",
        print_run=25,
        autograph=True,
        front_image="/static/assets/cards/jude_bellingham_auto_25.jpg",
        significance_score=70,
        released="2023",
        tags=("Low Print Run", "On-Card Auto"),
    ),
}


@dataclass(frozen=True)
class CardInstance:
    """CARD_INSTANCE — a specific owned copy. References a CARD_MASTER by id; never
    re-describes the card itself. See docs/ARCHITECTURE.md sections C and G."""
    instance_id: str
    card_id: str
    grade: str
    acquired_price: float
    acquired_date: str
    status: str  # PC | TRADE | SELL | OPEN | PRIVATE | SOLD | PENDING


# Demo collection for a single seeded user. Phase 1 replaces this with real
# per-user persistence (docs/ARCHITECTURE.md, Milestone 2) — the shape does not change.
# Two catalog cards (Shaq, Bellingham) are deliberately left unowned so Suggested
# Pickups has something real to recommend and the Trade Table demo has a sample
# opponent inventory, instead of both being empty/fabricated.
COLLECTION: list[CardInstance] = [
    CardInstance("inst-1", "mj-scoring-kings-5", "PSA 8", 1470.0, "2025-11-20", "PC"),
    CardInstance("inst-2", "jordan-fleer-86-57", "Raw", 3200.0, "2024-06-01", "PC"),
    CardInstance("inst-3", "yamal-topps-chrome-auto-298", "Raw", 640.0, "2025-08-02", "OPEN"),
]

# Sample second collector's inventory, for the Trade Table preview only (see
# docs/ARCHITECTURE.md section I). Not a real second user/account.
OPPONENT_NAME = "Marcus T."
OPPONENT_COLLECTION: list[CardInstance] = [
    CardInstance("opp-1", "shaq-beam-team-7", "Raw", 210.0, "2025-01-14", "TRADE"),
    CardInstance("opp-2", "bellingham-tier-one-auto-25", "Raw", 890.0, "2025-03-30", "TRADE"),
]
