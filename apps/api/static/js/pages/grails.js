import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CollectionGrid } from "../components/CollectionGrid.js";
import { withState } from "../components/States.js";

mountShell(null);

async function main() {
  const gridEl = document.getElementById("grid");
  await withState(
    gridEl,
    api.getGrails,
    (cards, el) => el.appendChild(CollectionGrid(cards.map((card) => ({ card, status: null, grade: card.grade })))),
    (cards) => cards.length === 0,
    "No Grail-rated cards yet — they appear as market data accumulates."
  );
}

main();
