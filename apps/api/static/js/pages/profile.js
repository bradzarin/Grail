import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { withState } from "../components/States.js";
import { money } from "../format.js";
import { listWantedIds } from "../wants.js";

mountShell("profile");

async function main() {
  const root = document.getElementById("profile-root");
  await withState(root, api.getCollectionSummary, (summary, el) => {
    const card = document.createElement("div");
    card.className = "summary-strip";
    const stats = [
      ["Cards Owned", summary.card_count],
      ["Grail-Rated", summary.grail_count],
      ["Est. Value", summary.total_estimated_value !== null ? money(summary.total_estimated_value) : "—"],
      ["Cost Basis", money(summary.cost_basis)],
      ["Wants", listWantedIds().length],
    ];
    stats.forEach(([label, value]) => {
      const cell = document.createElement("div");
      cell.className = "summary-stat";
      cell.innerHTML = `<div class="summary-stat__label">${label}</div><div class="summary-stat__value">${value}</div>`;
      card.appendChild(cell);
    });
    el.appendChild(card);

    const note = document.createElement("div");
    note.className = "market-read";
    note.style.marginTop = "20px";
    note.textContent = "Account settings, reputation/trust score and verification live here once auth ships (docs/ARCHITECTURE.md, Phase 1).";
    el.appendChild(note);
  });
}

main();
