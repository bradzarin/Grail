
import os
import re
from datetime import datetime
import httpx
from bs4 import BeautifulSoup
from .base import SourceAdapter

class PsaAprPublicAdapter(SourceAdapter):
    """Conservative public-page adapter.

    Set PSA_APR_URL to the exact PSA Auction Prices Realized result page for
    the canonical card. It only accepts rows it can parse from returned public
    HTML. Production should prefer a licensed feed/partnership if available.
    """
    name = "psa-apr-public"

    async def fetch(self, card):
        url = os.getenv("PSA_APR_URL","").strip()
        if not url:
            return []
        async with httpx.AsyncClient(timeout=20, follow_redirects=True,
                                     headers={"User-Agent":"TheGrailMarketMonitor/0.1"}) as client:
            r = await client.get(url)
            r.raise_for_status()
        text = " ".join(BeautifulSoup(r.text,"html.parser").stripped_strings)
        # Exact markup varies; only normalize obvious dated dollar results.
        pats = re.findall(
            r"(?P<date>\d{1,2}/\d{1,2}/20\d{2}).{0,100}?\$(?P<price>[\d,]+(?:\.\d{1,2})?)",
            text
        )
        out=[]
        for idx,(ds,ps) in enumerate(pats):
            try: dt=datetime.strptime(ds,"%m/%d/%Y")
            except ValueError: continue
            out.append({
                "card_id":card.card_id,"grade":card.grade,
                "sold_at":dt.strftime("%Y-%m-%d"),
                "price":float(ps.replace(",","")),
                "venue":"PSA Auction Prices Realized",
                "source_url":url,
                "external_id":f"psa-{idx}-{dt:%Y%m%d}-{ps}",
                "verified":True
            })
        return out
