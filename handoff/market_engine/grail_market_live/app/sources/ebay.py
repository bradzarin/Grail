
import os
import httpx
from .base import SourceAdapter

class EbayMarketplaceInsightsAdapter(SourceAdapter):
    """Official eBay sold-history connector.

    eBay's Marketplace Insights API is Limited Release. This adapter is inert
    unless an approved endpoint and OAuth token are supplied. This is
    intentional: do not replace it with prohibited scraping.
    """
    name = "ebay-marketplace-insights"

    async def fetch(self, card):
        token = os.getenv("EBAY_MARKETPLACE_INSIGHTS_TOKEN", "").strip()
        endpoint = os.getenv("EBAY_MARKETPLACE_INSIGHTS_ENDPOINT", "").strip()
        if not token or not endpoint:
            return []
        headers = {
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        }
        params = {"q": card.query, "limit": 200}
        async with httpx.AsyncClient(timeout=30, headers=headers) as client:
            r = await client.get(endpoint, params=params)
            r.raise_for_status()
            payload = r.json()

        rows = payload.get("itemSales") or payload.get("item_sales") or payload.get("sales") or []
        out = []
        for row in rows:
            price_obj = row.get("lastSoldPrice") or row.get("price") or {}
            price = price_obj.get("value") if isinstance(price_obj, dict) else price_obj
            sold_at = row.get("lastSoldDate") or row.get("soldDate") or row.get("sold_at")
            if not price or not sold_at:
                continue
            out.append({
                "card_id": card.card_id,
                "grade": card.grade,
                "sold_at": str(sold_at)[:10],
                "price": float(price),
                "venue": "eBay",
                "source_url": row.get("itemWebUrl"),
                "external_id": str(row.get("itemId") or row.get("id") or ""),
                "verified": True,
            })
        return out
