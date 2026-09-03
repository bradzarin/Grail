import { api } from "../api.js";
import { money } from "../format.js";

function barRow(row, maxValue) {
  const div = document.createElement("div");
  div.className = "breakdown-row";
  const pct = row.total_value ? Math.max(4, (row.total_value / maxValue) * 100) : 0;
  const gainKnown = row.gain_pct !== null && row.gain_pct !== undefined;
  const dir = !gainKnown ? "flat" : row.gain_pct >= 0.5 ? "up" : row.gain_pct <= -0.5 ? "down" : "flat";
  div.innerHTML = `
    <div class="breakdown-row__top">
      <span class="breakdown-row__key">${row.key}</span>
      <span class="breakdown-row__value">${row.total_value !== null ? money(row.total_value) : "—"}</span>
    </div>
    <div class="breakdown-row__bar-track">
      <div class="breakdown-row__bar" style="width:${pct}%"></div>
    </div>
    <div class="breakdown-row__sub">
      <span>${row.card_count} card${row.card_count === 1 ? "" : "s"}</span>
      <span class="breakdown-row__gain breakdown-row__gain--${dir}">${gainKnown ? `${row.gain_pct >= 0 ? "▲" : "▼"} ${Math.abs(row.gain_pct)}%` : "no data yet"}</span>
    </div>
  `;
  return div;
}

// Same portfolio, read by sport or by player — the other lenses
// docs/POSITIONING.md calls for alongside card-level and whole-portfolio views.
export function BreakdownWidget() {
  const card = document.createElement("div");
  card.className = "widget-card";
  card.innerHTML = `
    <div class="widget-card__head">
      <h3>Portfolio Breakdown</h3>
      <div class="period-toggle" id="breakdown-toggle">
        <button data-by="sport" class="active">By Sport</button>
        <button data-by="player">By Player</button>
      </div>
    </div>
  `;
  const body = document.createElement("div");
  card.appendChild(body);

  async function load(by) {
    body.innerHTML = `<div class="state-block" style="padding:24px"><div class="spinner"></div>Loading…</div>`;
    try {
      const rows = await api.getCollectionBreakdown(by);
      body.innerHTML = "";
      if (!rows.length) {
        body.appendChild(Object.assign(document.createElement("div"), {
          className: "state-block",
          textContent: "Nothing to break down yet.",
        }));
        return;
      }
      const maxValue = Math.max(...rows.map((r) => r.total_value || 0), 1);
      rows.forEach((r) => body.appendChild(barRow(r, maxValue)));
    } catch (err) {
      body.innerHTML = "";
      const div = document.createElement("div");
      div.className = "state-block state-block--error";
      div.textContent = `Couldn't load breakdown — ${err.message}`;
      body.appendChild(div);
    }
  }

  card.querySelector("#breakdown-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-by]");
    if (!btn) return;
    card.querySelectorAll("#breakdown-toggle button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    load(btn.dataset.by);
  });

  load("sport");
  return card;
}
