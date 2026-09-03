import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CardArt } from "../components/CardArt.js";
import { money } from "../format.js";
import { LoadingState, ErrorState } from "../components/States.js";
import { showToast } from "../toast.js";

mountShell("trade");

function estimateOf(item) {
  return item.card.estimate.estimate || 0;
}

function renderSide(label, items, selected, onToggle) {
  const side = document.createElement("div");
  side.className = "trade-side";

  const total = items.reduce((sum, i) => (selected.has(i.instance_id) ? sum + estimateOf(i) : sum), 0);
  const head = document.createElement("div");
  head.className = "trade-side__head";
  head.innerHTML = `<span class="label">${label}</span><span class="total">${money(total)}</span>`;
  side.appendChild(head);

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "state-block";
    empty.textContent = "No cards available.";
    side.appendChild(empty);
    return side;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "trade-card-row";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = selected.has(item.instance_id);
    check.addEventListener("change", () => onToggle(item.instance_id, check.checked));
    row.appendChild(check);

    const thumb = document.createElement("a");
    thumb.className = "thumb";
    thumb.href = `/card.html?id=${encodeURIComponent(item.card.card_id)}`;
    thumb.appendChild(CardArt(item.card));
    row.appendChild(thumb);

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `<div class="title">${item.card.title}</div><div class="sub">${item.card.year} · ${item.grade}</div>`;
    row.appendChild(info);

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = item.card.estimate.estimate ? money(item.card.estimate.estimate) : "—";
    row.appendChild(price);

    side.appendChild(row);
  });

  return side;
}

async function main() {
  const root = document.getElementById("trade-root");
  root.appendChild(LoadingState("Loading Trade Table…"));

  let demo;
  try {
    demo = await api.getTradeDemo();
  } catch (err) {
    root.innerHTML = "";
    root.appendChild(ErrorState(`Couldn't load the Trade Table — ${err.message}`, main));
    return;
  }
  root.innerHTML = "";

  const youSelected = new Set(demo.you.map((i) => i.instance_id));
  const themSelected = new Set(demo.them.map((i) => i.instance_id));

  const head = document.createElement("div");
  head.className = "trade-head";
  head.innerHTML = `
    <div>
      <h1>Trade Table</h1>
      <p>You vs. ${demo.opponent_name} — a sample pairing built from real Collection data. Not a live matched trade.</p>
    </div>
  `;
  root.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "trade-grid";
  root.appendChild(grid);

  const vs = document.createElement("div");
  vs.className = "trade-vs";
  vs.textContent = "VS";

  const align = document.createElement("div");
  align.className = "alignment-block";
  root.appendChild(align);

  const actions = document.createElement("div");
  actions.className = "trade-actions";
  actions.innerHTML = `<button class="decline">Decline</button><button class="accept">Propose Trade</button>`;
  actions.querySelector(".decline").addEventListener("click", () => showToast("Trade discarded."));
  actions.querySelector(".accept").addEventListener("click", () =>
    showToast("Trade negotiation (offers, countering, settlement) ships with the Marketplace milestone.")
  );
  root.appendChild(actions);

  function renderAll() {
    grid.innerHTML = "";
    grid.appendChild(renderSide("You", demo.you, youSelected, (id, checked) => {
      checked ? youSelected.add(id) : youSelected.delete(id);
      renderAll();
    }));
    grid.appendChild(vs);
    grid.appendChild(renderSide(demo.opponent_name, demo.them, themSelected, (id, checked) => {
      checked ? themSelected.add(id) : themSelected.delete(id);
      renderAll();
    }));

    const youPriced = demo.you.filter((i) => youSelected.has(i.instance_id) && estimateOf(i) > 0);
    const themPriced = demo.them.filter((i) => themSelected.has(i.instance_id) && estimateOf(i) > 0);
    const youTotal = youPriced.reduce((s, i) => s + estimateOf(i), 0);
    const themTotal = themPriced.reduce((s, i) => s + estimateOf(i), 0);

    if (!youPriced.length || !themPriced.length) {
      align.innerHTML = `
        <div class="label">Market Alignment</div>
        <div class="pct" style="font-size:15px;color:var(--ink-faint)">Not enough priced cards selected</div>
      `;
    } else {
      const maxTotal = Math.max(youTotal, themTotal, 1);
      const alignment = Math.round(100 - (Math.abs(youTotal - themTotal) / maxTotal) * 100);
      align.innerHTML = `
        <div class="label">Market Alignment</div>
        <div class="pct">${alignment}%</div>
        <div class="meter-bar" style="max-width:320px;margin:0 auto"></div>
      `;
    }
  }

  renderAll();
}

main();
