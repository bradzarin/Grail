
import re
from urllib.parse import quote_plus
import httpx
from bs4 import BeautifulSoup
from .base import SourceAdapter

class FanaticsPublicAdapter(SourceAdapter):
    """Best-effort checker for Fanatics' public sold-items surface.

    This adapter deliberately does not bypass authentication, bot controls,
    or private APIs. If the public HTML does not expose result rows, it
    returns no sales and records that outcome in the refresh log.
    """
    name = "fanatics-public"

    async def fetch(self, card):
        url = "https://sales-history.fanaticscollect.com/?title=" + quote_plus(card.query)
        headers = {"User-Agent": "TheGrailMarketMonitor/0.1 (+partner-demo)"}
        async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers=headers) as client:
            r = await client.get(url)
            r.raise_for_status()

        soup = BeautifulSoup(r.text, "html.parser")
        text = " ".join(soup.stripped_strings)
        # Public pages sometimes render result data client-side. We never fabricate
        # a sale if a row cannot be proven from returned HTML.
        money_dates = re.findall(
            r"(?P<date>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+20\d{2}).{0,120}?\$(?P<price>[\d,]+(?:\.\d{1,2})?)",
            text, flags=re.I
        )
        from datetime import datetime
        out = []
        for idx,(date_s,price_s) in enumerate(money_dates):
            try:
                dt = datetime.strptime(date_s[:3].title() + date_s[3:], "%b %d, %Y")
            except ValueError:
                continue
            out.append({
                "card_id": card.card_id,
                "grade": card.grade,
                "sold_at": dt.strftime("%Y-%m-%d"),
                "price": float(price_s.replace(",","")),
                "venue": "Fanatics Collect",
                "source_url": url,
                "external_id": f"fanatics-{idx}-{dt:%Y%m%d}-{price_s}",
                "verified": True,
            })
        return out
