import { money, shortDate } from "../format.js";
import { api } from "../api.js";

const PERIODS = [
  ["30D", 30],
  ["90D", 90],
  ["1Y", 365],
  ["2Y", 730],
  ["ALL", null],
];

// Real grade taxonomy shown as tabs. Only the card's actual stored grade has
// sales — switching to another tab honestly shows the empty state rather than
// fabricating a curve, per HANDOFF.md section 5 ("sparse data stays sparse").
const GRADE_TABS = ["Raw", "PSA <5", "PSA 5", "PSA 6", "PSA 7", "PSA 8", "PSA 9", "PSA 10"];

const W = 900, H = 300, L = 64, R = 20, T = 20, B = 40;

function dateMs(iso) {
  return new Date(iso + "T00:00:00Z").getTime();
}

function axisLabel(ms, days) {
  const d = new Date(ms);
  const opts = !days || days <= 90
    ? { month: "short", day: "numeric", timeZone: "UTC" }
    : { month: "short", year: "2-digit", timeZone: "UTC" };
  return d.toLocaleDateString("en-US", opts);
}

// True-calendar-spacing ticker over actual completed sales only. Never
// interpolates between transactions. See HANDOFF.md section 5.
export function MarketTicker(cardId, cardGrade, initialSales) {
  const root = document.createElement("div");
  root.className = "ticker-card";

  let periodDays = 365;
  let grade = cardGrade;
  let sales = initialSales;

  let showSales = false;

  const head = document.createElement("div");
  head.className = "ticker-card__head";
  head.innerHTML = `<h2>Market Trends</h2>`;
  const salesToggleBtn = document.createElement("button");
  salesToggleBtn.className = "filter-pill";
  salesToggleBtn.textContent = "Show Sales";
  salesToggleBtn.addEventListener("click", () => {
    showSales = !showSales;
    salesToggleBtn.classList.toggle("active", showSales);
    drawSalesTable();
  });
  head.appendChild(salesToggleBtn);
  const periodToggle = document.createElement("div");
  periodToggle.className = "period-toggle";
  PERIODS.forEach(([label, days]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (days === periodDays) btn.classList.add("active");
    btn.addEventListener("click", () => {
      periodDays = days;
      periodToggle.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      draw();
    });
    periodToggle.appendChild(btn);
  });
  head.appendChild(periodToggle);
  root.appendChild(head);

  const gradeToggle = document.createElement("div");
  gradeToggle.className = "period-toggle";
  gradeToggle.style.marginBottom = "14px";
  gradeToggle.style.flexWrap = "wrap";
  GRADE_TABS.forEach((g) => {
    const btn = document.createElement("button");
    btn.textContent = g;
    if (g === grade) btn.classList.add("active");
    btn.addEventListener("click", async () => {
      if (g === grade) return;
      grade = g;
      gradeToggle.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      wrap.innerHTML = "";
      wrap.appendChild(loadingBlock());
      const trend = await api.getTrend(cardId, grade);
      sales = trend.sales || [];
      draw();
    });
    gradeToggle.appendChild(btn);
  });
  root.appendChild(gradeToggle);

  const wrap = document.createElement("div");
  wrap.className = "ticker-svg-wrap";
  root.appendChild(wrap);

  const meta = document.createElement("div");
  meta.className = "market-read";
  meta.style.marginTop = "12px";
  root.appendChild(meta);

  const salesTable = document.createElement("div");
  root.appendChild(salesTable);

  let lastRows = [];

  function drawSalesTable() {
    salesTable.innerHTML = "";
    if (!showSales || !lastRows.length) return;
    const table = document.createElement("table");
    table.className = "sales-table";
    const ordered = [...lastRows].reverse();
    table.innerHTML = `
      <thead><tr><th>Date</th><th>Price</th><th>Venue</th><th>Status</th></tr></thead>
      <tbody>${ordered.slice(0, 15).map((r) => `
        <tr>
          <td>${shortDate(r.date)}</td>
          <td>${money(r.price)}</td>
          <td>${r.venue}</td>
          <td>${r.verified ? "Verified" : "Unverified"}</td>
        </tr>`).join("")}</tbody>
    `;
    salesTable.appendChild(table);
    if (ordered.length > 15) {
      const more = document.createElement("div");
      more.className = "market-read";
      more.style.marginTop = "8px";
      more.textContent = `+${ordered.length - 15} more sale${ordered.length - 15 === 1 ? "" : "s"} not shown.`;
      salesTable.appendChild(more);
    }
  }

  function draw() {
    wrap.innerHTML = "";
    meta.textContent = "";
    lastRows = [];
    drawSalesTable();

    if (!sales.length) {
      wrap.appendChild(emptyBlock(
        grade === cardGrade
          ? "No completed sales recorded yet for this card."
          : `No completed sales recorded for ${grade}. This card is tracked as ${cardGrade}.`
      ));
      return;
    }

    const end = Math.max(...sales.map((s) => dateMs(s.date)));
    const start = periodDays ? end - periodDays * 86400000 : Math.min(...sales.map((s) => dateMs(s.date)));
    const rows = sales.filter((s) => dateMs(s.date) >= start && dateMs(s.date) <= end);
    lastRows = rows;
    drawSalesTable();

    if (!rows.length) {
      wrap.appendChild(emptyBlock("No completed sales in this period. Sparse data stays sparse — try a wider range."));
      return;
    }

    const vals = rows.map((r) => r.price);
    const ymin = Math.max(0, Math.floor((Math.min(...vals) * 0.85) / 100) * 100);
    const ymax = Math.ceil((Math.max(...vals) * 1.1) / 100) * 100;
    const span = Math.max(1, end - start);
    const X = (x) => L + ((W - L - R) * (x - start)) / span;
    const Y = (y) => T + (H - T - B) * (1 - (y - ymin) / Math.max(1, ymax - ymin));

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("class", "ticker-svg");
    svg.style.width = "100%";
    svg.style.display = "block";

    const grid = document.createElementNS(svgNS, "g");
    for (let i = 0; i < 5; i++) {
      const y = T + ((H - T - B) * i) / 4;
      const v = ymax - ((ymax - ymin) * i) / 4;
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", L); line.setAttribute("x2", W - R);
      line.setAttribute("y1", y); line.setAttribute("y2", y);
      line.setAttribute("stroke", "#e7e7eb"); line.setAttribute("stroke-dasharray", "4 4");
      grid.appendChild(line);
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", 4); text.setAttribute("y", y + 4);
      text.setAttribute("font-size", "11"); text.setAttribute("fill", "#8a8a92");
      text.textContent = money(v);
      grid.appendChild(text);
    }
    const tickCount = !periodDays || periodDays > 365 ? 6 : periodDays <= 30 ? 4 : 5;
    for (let i = 0; i < tickCount; i++) {
      const ms = start + (span * i) / (tickCount - 1);
      const x = X(ms);
      const anchor = i === 0 ? "start" : i === tickCount - 1 ? "end" : "middle";
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", x); text.setAttribute("y", H - 14);
      text.setAttribute("text-anchor", anchor);
      text.setAttribute("font-size", "11"); text.setAttribute("fill", "#8a8a92");
      text.textContent = axisLabel(ms, periodDays);
      grid.appendChild(text);
    }
    svg.appendChild(grid);

    const areaPath = document.createElementNS(svgNS, "path");
    const linePath = rows.map((r, i) => `${i ? "L" : "M"}${X(dateMs(r.date))} ${Y(r.price)}`).join(" ");
    areaPath.setAttribute("fill", "url(#tickerGradient)");
    areaPath.setAttribute("stroke", "none");
    areaPath.setAttribute("d", `${linePath} L${X(dateMs(rows[rows.length - 1].date))} ${H - B} L${X(dateMs(rows[0].date))} ${H - B} Z`);
    const defs = document.createElementNS(svgNS, "defs");
    defs.innerHTML = `<linearGradient id="tickerGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6d5bff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#6d5bff" stop-opacity="0"/>
    </linearGradient>`;
    svg.appendChild(defs);
    svg.appendChild(areaPath);

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#6d5bff");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("d", linePath);
    svg.appendChild(path);

    const tooltip = document.createElement("div");
    tooltip.className = "ticker-tooltip";
    wrap.appendChild(tooltip);

    rows.forEach((r) => {
      const cx = X(dateMs(r.date));
      const cy = Y(r.price);
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("r", 5);
      dot.setAttribute("fill", r.verified ? "#6d5bff" : "#c7c7cf");
      dot.setAttribute("stroke", "#fff"); dot.setAttribute("stroke-width", "2");
      dot.style.cursor = "pointer";
      dot.addEventListener("mouseenter", () => {
        tooltip.innerHTML = `${shortDate(r.date)}<br><b>${money(r.price)}</b> · ${r.venue}${r.verified ? "" : " (unverified)"}`;
        tooltip.style.left = `${(cx / W) * 100}%`;
        tooltip.style.top = `${(cy / H) * 100}%`;
        tooltip.classList.add("visible");
      });
      dot.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      svg.appendChild(dot);
    });

    wrap.appendChild(svg);
    meta.textContent = `${rows.length} completed sale${rows.length === 1 ? "" : "s"} shown for this period. Last stored sale: ${shortDate(rows[rows.length - 1].date)}.`;
  }

  function emptyBlock(text) {
    const div = document.createElement("div");
    div.className = "state-block";
    div.textContent = text;
    return div;
  }

  function loadingBlock() {
    const div = document.createElement("div");
    div.className = "state-block";
    div.innerHTML = `<div class="spinner"></div>Loading…`;
    return div;
  }

  draw();
  return root;
}
