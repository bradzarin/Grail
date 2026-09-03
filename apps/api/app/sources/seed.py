from .base import SourceAdapter

# Real completed-sale data, looked up by hand (not scraped) via PSA's Auction
# Prices Realized product — a licensed data business that itself aggregates
# eBay/Fanatics Collect/Goldin/etc. completed sales, accessed through an
# authenticated PSA account. See docs/ARCHITECTURE.md section E for why this
# exists instead of a live scraper: none of eBay/PSA/Heritage/Card Ladder/
# Sports Card Investor have a free, ToS-compliant automated path to this data,
# and eBay's own bot detection blocks automated access outright (confirmed —
# it CAPTCHA-walled an attempted lookup even through an authenticated,
# human-driven browser session).
#
# Each entry is (date, price, venue) exactly as PSA's sales history displayed
# it at lookup time. `source_url` is the PSA spec page it came from, for
# re-auditing. Every row here is real; nothing is interpolated or invented.
SEED_BY_CARD = {
    "mj-scoring-kings-5": {
        "source_url": "https://www.psacard.com/spec/psa/307699?g=8",
        "sales": [
            ("2026-07-09", 6765.00, "Goldin Auctions"),
            ("2026-07-10", 7375.00, "Goldin Auctions"),
            ("2026-07-10", 6200.00, "eBay"),
            ("2026-07-10", 6750.00, "Fanatics Collect"),
            ("2026-07-12", 6600.00, "Fanatics Collect"),
            ("2026-07-14", 6300.00, "eBay"),
            ("2026-07-18", 6500.00, "eBay"),
            ("2026-07-19", 6300.00, "eBay"),
            ("2026-07-19", 5500.00, "Fanatics Collect"),
            ("2026-07-25", 6899.00, "eBay"),
            ("2026-07-30", 6500.00, "eBay"),
            ("2026-07-31", 5900.00, "Fanatics Collect"),
            ("2026-08-02", 6167.00, "eBay"),
            ("2026-08-04", 6089.99, "eBay"),
            ("2026-08-04", 6689.00, "eBay"),
            ("2026-08-06", 6499.00, "eBay"),
            ("2026-08-08", 5648.40, "eBay"),
            ("2026-08-09", 5100.00, "eBay"),
            ("2026-08-11", 6200.00, "eBay"),
            ("2026-08-14", 6100.00, "eBay"),
            ("2026-08-15", 6300.00, "eBay"),
            ("2026-08-16", 4964.11, "eBay"),
            ("2026-08-16", 6100.00, "eBay"),
            ("2026-08-16", 5877.77, "eBay"),
            ("2026-08-17", 6200.00, "eBay"),
            ("2026-08-17", 6699.95, "eBay"),
            ("2026-08-20", 6200.00, "eBay"),
            ("2026-08-22", 6300.00, "eBay"),
            ("2026-08-23", 5400.00, "Fanatics Collect"),
            ("2026-08-23", 5400.00, "Fanatics Collect"),
            ("2026-08-27", 6250.00, "eBay"),
            ("2026-08-30", 6400.00, "eBay"),
            ("2026-08-30", 6100.00, "eBay"),
            ("2026-08-30", 5280.00, "Fanatics Collect"),
            ("2026-08-31", 6000.00, "eBay"),
        ],
    },
    "jordan-fleer-86-57": {
        "source_url": "https://www.psacard.com/spec/psa/299576?g=ungraded",
        "sales": [
            ("2026-08-08", 6323.00, "eBay"),
            ("2026-08-10", 4350.00, "eBay"),
            ("2026-08-12", 26500.00, "eBay"),
            ("2026-08-13", 500.00, "eBay"),
            ("2026-08-14", 2850.00, "eBay"),
            ("2026-08-14", 7300.00, "eBay"),
            ("2026-08-15", 2000.00, "eBay"),
            ("2026-08-15", 7000.00, "eBay"),
            ("2026-08-16", 3150.00, "eBay"),
            ("2026-08-20", 300.00, "eBay"),
            ("2026-08-20", 300.00, "eBay"),
            ("2026-08-20", 11000.00, "eBay"),
            ("2026-08-25", 2500.00, "eBay"),
            ("2026-08-25", 3100.00, "eBay"),
            ("2026-08-25", 16200.00, "eBay"),
        ],
    },
    "shaq-beam-team-7": {
        # PSA/checklist name for this insert is "1993 Ultra Power In The Key" —
        # the handoff's "Beam Team" is a nickname, not the cataloged set name.
        "source_url": "https://www.psacard.com/spec/psa/307872?g=ungraded",
        "sales": [
            ("2026-08-30", 60.00, "eBay"),
            ("2026-08-30", 63.00, "eBay"),
            ("2026-08-30", 70.00, "eBay"),
            ("2026-08-30", 86.00, "eBay"),
            ("2026-08-30", 90.00, "eBay"),
        ],
    },
    "yamal-topps-chrome-auto-298": {
        # Closest real match to the demo card's spec (base Chrome Autograph,
        # no color-parallel name) — PSA's page didn't surface an exact "/298"
        # print run for this listing; treat the serial number as illustrative.
        "source_url": "https://www.psacard.com/spec/psa/11497397?g=ungraded",
        "sales": [
            ("2026-07-28", 879.00, "eBay"),
            ("2026-08-03", 1850.00, "eBay"),
            ("2026-08-03", 2150.00, "eBay"),
            ("2026-08-09", 1850.99, "eBay"),
            ("2026-08-19", 999.00, "eBay"),
        ],
    },
    "bellingham-tier-one-auto-25": {
        # Real product is Topps Tier One Bundesliga (not Panini, as modeled) —
        # noted here since it surfaced during lookup; not corrected in
        # models.py to keep this change scoped to market data.
        "source_url": "https://www.psacard.com/spec/psa/5316038?g=ungraded",
        "sales": [
            ("2026-01-28", 140.00, "eBay"),
        ],
    },
    "messi-kaboom": {
        "source_url": "https://www.psacard.com/spec/psa/11111762?g=ungraded",
        "sales": [
            ("2025-05-03", 1813.00, "eBay"),
            ("2025-08-19", 1450.00, "eBay"),
            ("2026-03-04", 3450.00, "eBay"),
            ("2026-04-04", 4000.00, "eBay"),
        ],
    },
    "ohtani-rookie": {
        "source_url": "https://www.psacard.com/spec/psa/2659436?g=ungraded",
        "sales": [
            ("2026-08-26", 1225.00, "eBay"),
            ("2026-08-26", 478.00, "eBay"),
            ("2026-08-30", 346.00, "eBay"),
            ("2026-08-30", 450.00, "eBay"),
            ("2026-09-01", 525.00, "eBay"),
        ],
    },
    "zidane-legend": {
        "source_url": "https://www.psacard.com/spec/psa/9375269?g=ungraded",
        "sales": [
            ("2025-12-20", 181.87, "eBay"),
            ("2025-12-26", 200.00, "eBay"),
            ("2026-05-03", 259.79, "eBay"),
            ("2026-06-04", 565.97, "eBay"),
            ("2026-07-19", 257.64, "eBay"),
        ],
    },
}


class SeedAdapter(SourceAdapter):
    name = "seed"

    async def fetch(self, card):
        entry = SEED_BY_CARD.get(card.card_id)
        if not entry:
            return []
        source_url = entry["source_url"]
        return [{
            "card_id": card.card_id,
            "grade": card.grade,
            "sold_at": d,
            "price": p,
            "venue": v,
            "source_url": source_url,
            "external_id": f"seed-{card.card_id}-{i}-{d}-{p}-{v}",
            "verified": True,
        } for i, (d, p, v) in enumerate(entry["sales"])]
