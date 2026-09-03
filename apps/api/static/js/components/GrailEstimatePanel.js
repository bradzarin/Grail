import { money, shortDate } from "../format.js";
import { ConfidencePill } from "./Badges.js";

const CONFIDENCE_POSITION = { LOW: 14, MEDIUM: 50, HIGH: 86 };

function meterBar(confidence) {
  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  wrap.style.maxWidth = "220px";
  const bar = document.createElement("div");
  bar.className = "meter-bar";
  wrap.appendChild(bar);
  const marker = document.createElement("div");
  marker.style.position = "absolute";
  marker.style.top = "-3px";
  marker.style.width = "12px";
  marker.style.height = "12px";
  marker.style.borderRadius = "50%";
  marker.style.background = "#fff";
  marker.style.border = "2px solid var(--ink)";
  marker.style.left = `${CONFIDENCE_POSITION[confidence] ?? 14}%`;
  marker.style.transform = "translateX(-50%)";
  wrap.appendChild(marker);
  return wrap;
}

// Renders the estimate/range/confidence hierarchy from HANDOFF.md section 6.
// Never fills in a number when the API says there isn't enough data (section E).
export function GrailEstimatePanel(estimate) {
  const div = document.createElement("div");
  div.className = "estimate-panel";

  if (estimate.insufficient_data) {
    div.innerHTML = `
      <div class="estimate-panel__top">
        <span class="estimate-panel__value" style="font-size:20px;color:var(--ink-faint)">Estimate unavailable</span>
        ${ConfidencePill("LOW").outerHTML}
      </div>
    `;
    div.appendChild(meterBar("LOW"));
    const read = document.createElement("div");
    read.className = "market-read";
    read.style.marginTop = "14px";
    read.textContent = estimate.market_read;
    div.appendChild(read);
    return div;
  }

  const top = document.createElement("div");
  top.className = "estimate-panel__top";
  top.innerHTML = `<span class="estimate-panel__value">${money(estimate.estimate)}</span>`;
  top.appendChild(ConfidencePill(estimate.confidence));
  div.appendChild(top);
  div.appendChild(meterBar(estimate.confidence));

  const range = document.createElement("div");
  range.className = "estimate-panel__range";
  range.style.marginTop = "10px";
  range.textContent = `Likely range ${money(estimate.range_low)} – ${money(estimate.range_high)}`;
  div.appendChild(range);

  const stats = document.createElement("div");
  stats.className = "estimate-panel__stats";
  const cells = [
    ["Last sale", estimate.last_sale ? `${money(estimate.last_sale.price)}` : "—"],
    ["30D avg", money(estimate.avg_30d)],
    ["90D avg", money(estimate.avg_90d)],
    ["Sales (90D)", String(estimate.sale_count_90d)],
    ["Sales (total)", String(estimate.sale_count_total)],
    ["Last sale date", estimate.last_sale ? shortDate(estimate.last_sale.date) : "—"],
  ];
  cells.forEach(([label, value]) => {
    const cell = document.createElement("div");
    cell.innerHTML = `<div class="estimate-stat__label">${label}</div><div class="estimate-stat__value">${value}</div>`;
    stats.appendChild(cell);
  });
  div.appendChild(stats);

  const read = document.createElement("div");
  read.className = "market-read";
  read.textContent = estimate.market_read;
  div.appendChild(read);

  return div;
}
