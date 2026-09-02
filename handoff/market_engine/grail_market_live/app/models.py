
from dataclasses import dataclass

@dataclass(frozen=True)
class CardSpec:
    card_id: str
    query: str
    grade: str
    title: str

CARDS = {
    "mj-scoring-kings-5": CardSpec(
        card_id="mj-scoring-kings-5",
        query='"1993 Ultra Scoring Kings" "Michael Jordan" #5 PSA 8',
        grade="PSA 8",
        title="Michael Jordan 1993 Ultra Scoring Kings #5 — PSA 8",
    )
}
