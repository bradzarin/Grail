
from .base import SourceAdapter

SEED = [
    ("2025-11-17",1470,"Fanatics Collect"),
    ("2025-12-29",1770,"Fanatics Collect"),
    ("2026-02-23",2070,"Fanatics Collect"),
    ("2026-03-30",3000,"Fanatics Collect"),
    ("2026-04-25",2770,"Fanatics Collect"),
    ("2026-05-04",2880,"Fanatics Collect"),
    ("2026-05-18",3720,"Fanatics Collect"),
    ("2026-06-29",5040,"Fanatics Collect"),
    ("2026-07-09",4650,"Fanatics Collect"),
    ("2026-07-10",6750,"Fanatics Collect"),
    ("2026-07-13",6600,"Fanatics Collect"),
    ("2026-07-19",5500,"Fanatics Collect"),
    ("2026-07-31",5900,"Fanatics Collect"),
    ("2026-08-24",5400,"Fanatics Collect"),
    ("2026-08-27",6250,"eBay / public aggregator"),
    ("2026-08-31",6100,"eBay / public aggregator"),
    ("2026-08-31",6400,"eBay / public aggregator"),
]

class SeedAdapter(SourceAdapter):
    name = "seed"
    async def fetch(self, card):
        return [{
            "card_id": card.card_id,
            "grade": card.grade,
            "sold_at": d,
            "price": p,
            "venue": v,
            "external_id": f"seed-{d}-{p}-{v}",
            "verified": True,
        } for d,p,v in SEED]
