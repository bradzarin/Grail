
import asyncio, os, statistics
from datetime import datetime, timezone
from .db import insert_sale, sales, log_refresh
from .sources.seed import SeedAdapter
from .sources.fanatics import FanaticsPublicAdapter
from .sources.ebay import EbayMarketplaceInsightsAdapter
from .sources.psa import PsaAprPublicAdapter

def adapters(include_seed=False):
    a=[]
    if include_seed:
        a.append(SeedAdapter())
    if os.getenv("ENABLE_FANATICS_PUBLIC","true").lower()=="true":
        a.append(FanaticsPublicAdapter())
    if os.getenv("EBAY_MARKETPLACE_INSIGHTS_TOKEN","").strip():
        a.append(EbayMarketplaceInsightsAdapter())
    if os.getenv("ENABLE_PSA_PUBLIC","false").lower()=="true":
        a.append(PsaAprPublicAdapter())
    return a

async def refresh(card, include_seed=False):
    results=[]
    checked=datetime.now(timezone.utc).isoformat()
    for adapter in adapters(include_seed):
        try:
            rows=await adapter.fetch(card)
            inserted=sum(insert_sale(r) for r in rows)
            log_refresh(card.card_id, adapter.name, checked, inserted, "ok",
                        f"{len(rows)} normalized rows")
            results.append({"source":adapter.name,"found":len(rows),"inserted":inserted,"status":"ok"})
        except Exception as e:
            log_refresh(card.card_id, adapter.name, checked, 0, "error", str(e)[:500])
            results.append({"source":adapter.name,"found":0,"inserted":0,"status":"error","detail":str(e)})
    return results

def trend(card):
    rows=sales(card.card_id, card.grade)
    prices=[float(r["price"]) for r in rows]
    if not prices:
        return {"card_id":card.card_id,"grade":card.grade,"sales":[],"metrics":{}}
    recent=prices[-min(10,len(prices)):]
    return {
        "card_id":card.card_id,
        "grade":card.grade,
        "sales":[
            {"date":r["sold_at"],"price":r["price"],"venue":r["venue"],
             "source_url":r["source_url"],"verified":bool(r["verified"])}
            for r in rows
        ],
        "metrics":{
            "last":prices[-1],
            "count":len(prices),
            "average":round(statistics.mean(prices),2),
            "median":round(statistics.median(prices),2),
            "recent_average":round(statistics.mean(recent),2),
            "low":min(prices),
            "high":max(prices),
        }
    }
