import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CollectionGrid } from "../components/CollectionGrid.js";
import { AddCardForm } from "../components/AddCardForm.js";
import { withState } from "../components/States.js";

mountShell("market");

const params = new URLSearchParams(location.search);
const q = (params.get("q") || "").trim().toLowerCase();

document.getElementById("add-card").appendChild(AddCardForm(params.get("q") || ""));

function matches(card, query) {
  if (!query) return true;
  return [card.player, card.title, card.set_name, card.team, card.manufacturer]
    .filter(Boolean)
    .some((f) => f.toLowerCase().includes(query));
}

// The tracked catalog (CARDS) is small and rated; the bulk checklist
// (app/checklist.py — a growing multi-source registry of real card
// identities with no rating/sales yet) is searched separately so an empty or
// generic query never dumps the whole archive into the grid. See
// apps/api/README.md "Card catalog scope".
async function loadCombined() {
  const [tracked, checklist] = await Promise.all([
    api.getMarket(),
    q ? api.searchChecklist(q) : Promise.resolve([]),
  ]);
  return { tracked: tracked.filter((c) => matches(c, q)), checklist };
}

async function main() {
  const gridEl = document.getElementById("grid");
  await withState(
    gridEl,
    loadCombined,
    ({ tracked, checklist }, el) => {
      const total = tracked.length + checklist.length;
      if (q) {
        const note = document.createElement("div");
        note.className = "market-read";
        note.style.marginBottom = "16px";
        note.textContent = `Showing ${total} result${total === 1 ? "" : "s"} for "${q}"${
          checklist.length ? ` (${checklist.length} from the bulk checklist archive)` : ""
        }.`;
        el.appendChild(note);
      } else {
        const note = document.createElement("div");
        note.className = "market-read";
        note.style.marginBottom = "16px";
        note.textContent = `Tens of thousands more real cards (Topps Baseball 1952–2016, Panini and Topps insert/parallel checklists, and more) are searchable — try a player name above.`;
        el.appendChild(note);
      }
      el.appendChild(
        CollectionGrid(
          [...tracked, ...checklist].map((card) => ({ card, status: null, grade: card.grade }))
        )
      );
    },
    ({ tracked, checklist }) => tracked.length + checklist.length === 0,
    q ? `No cards match "${q}".` : "No cards in the catalog yet."
  );
}

main();
