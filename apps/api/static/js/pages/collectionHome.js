import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CollectionGrid } from "../components/CollectionGrid.js";
import { withState } from "../components/States.js";
import { money } from "../format.js";

mountShell("collection");

function SummaryStrip(summary) {
  const div = document.createElement("div");
  div.className = "summary-strip";
  const stats = [
    ["Cards", summary.card_count],
    ["Estimated Value", summary.total_estimated_value !== null ? money(summary.total_estimated_value) : "—"],
    ["Cost Basis", money(summary.cost_basis)],
    ["Grail-Rated", summary.grail_count],
  ];
  stats.forEach(([label, value]) => {
    const cell = document.createElement("div");
    cell.className = "summary-stat";
    cell.innerHTML = `<div class="summary-stat__label">${label}</div><div class="summary-stat__value">${value}</div>`;
    div.appendChild(cell);
  });
  return div;
}

async function main() {
  const summaryEl = document.getElementById("summary");
  const gridEl = document.getElementById("grid");

  const [summary] = await Promise.all([
    withState(summaryEl, api.getCollectionSummary, (data, el) => el.appendChild(SummaryStrip(data))),
  ]);

  let allItems = [];
  await withState(
    gridEl,
    api.getCollection,
    (items, el) => {
      allItems = items;
      el.appendChild(buildFilterable(items));
    },
    (items) => items.length === 0,
    "Your collection is empty — scan or add a card to get started."
  );
}

function buildFilterable(items) {
  const wrap = document.createElement("div");
  const statuses = ["ALL", ...Array.from(new Set(items.map((i) => i.status)))];
  const toolbar = document.createElement("div");
  toolbar.className = "collection-toolbar";
  const gridHolder = document.createElement("div");

  function renderGrid(filter) {
    gridHolder.innerHTML = "";
    const filtered = filter === "ALL" ? items : items.filter((i) => i.status === filter);
    gridHolder.appendChild(CollectionGrid(filtered));
  }

  statuses.forEach((status) => {
    const pill = document.createElement("button");
    pill.className = "filter-pill" + (status === "ALL" ? " active" : "");
    pill.textContent = status;
    pill.addEventListener("click", () => {
      toolbar.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      renderGrid(status);
    });
    toolbar.appendChild(pill);
  });

  wrap.appendChild(toolbar);
  wrap.appendChild(gridHolder);
  renderGrid("ALL");
  return wrap;
}

main();
