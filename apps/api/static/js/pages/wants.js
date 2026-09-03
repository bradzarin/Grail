import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CollectionGrid } from "../components/CollectionGrid.js";
import { withState } from "../components/States.js";
import { listWantedIds } from "../wants.js";

mountShell("wants");

async function main() {
  const gridEl = document.getElementById("grid");
  await withState(
    gridEl,
    api.getMarket,
    (cards, el) => {
      const wanted = new Set(listWantedIds());
      const items = cards.filter((c) => wanted.has(c.card_id));
      el.appendChild(CollectionGrid(items.map((card) => ({ card, status: null, grade: card.grade }))));
    },
    (cards) => {
      const wanted = new Set(listWantedIds());
      return cards.filter((c) => wanted.has(c.card_id)).length === 0;
    },
    "Nothing on your Wantlist yet — add a card from its Market Terminal page."
  );
}

main();
