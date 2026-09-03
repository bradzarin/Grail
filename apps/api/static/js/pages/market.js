import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CollectionGrid } from "../components/CollectionGrid.js";
import { withState } from "../components/States.js";

mountShell("market");

const params = new URLSearchParams(location.search);
const q = (params.get("q") || "").trim().toLowerCase();

function matches(card, query) {
  if (!query) return true;
  return [card.player, card.title, card.set_name, card.team, card.manufacturer]
    .filter(Boolean)
    .some((f) => f.toLowerCase().includes(query));
}

async function main() {
  const gridEl = document.getElementById("grid");
  await withState(
    gridEl,
    api.getMarket,
    (cards, el) => {
      const filtered = cards.filter((c) => matches(c, q));
      if (q) {
        const note = document.createElement("div");
        note.className = "market-read";
        note.style.marginBottom = "16px";
        note.textContent = `Showing ${filtered.length} result${filtered.length === 1 ? "" : "s"} for "${q}".`;
        el.appendChild(note);
      }
      el.appendChild(CollectionGrid(filtered.map((card) => ({ card, status: null, grade: card.grade }))));
    },
    (cards) => cards.filter((c) => matches(c, q)).length === 0,
    q ? `No cards match "${q}".` : "No cards in the catalog yet."
  );
}

main();
