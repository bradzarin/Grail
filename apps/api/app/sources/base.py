
from abc import ABC, abstractmethod
from typing import Iterable

class SourceAdapter(ABC):
    name = "base"

    @abstractmethod
    async def fetch(self, card) -> Iterable[dict]:
        """Return normalized completed-sale dictionaries.

        Required keys:
        card_id, grade, sold_at (YYYY-MM-DD), price, venue
        Optional:
        source_url, external_id, verified, buyer_premium, shipping
        """
        raise NotImplementedError
