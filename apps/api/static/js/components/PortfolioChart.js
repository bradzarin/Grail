import { money, shortDate } from "../format.js";

const PERIODS = [
  ["1M", 30],
  ["3M", 90],
  ["6M", 180],
  ["1Y", 365],
  ["ALL", null],
];

const W = 900, H = 260, L = 64, R = 20, T = 16, B = 34;

function dateMs(iso) {
  return new Date(iso + "T00:00:00Z").getTime();
}

function axisLabel(ms, days) {
  const d = new Date(ms);
  const opts = !days || days > 90
    ? { month: "short", year: "2-digit", timeZone: "UTC" }
    : { month: "short", day: "numeric", timeZone: "UTC" };
  return d.toLocaleDateString("en-US", opts);
}

// Robinhood/Coinbase-style portfolio value graph — reconstructed from the same
// Grail Estimate every card uses (app/portfolio.py), not a fabricated curve.
// See docs/POSITIONING.md: track the whole portfolio the way a brokerage app
// tracks a stock/crypto portfolio.
export function PortfolioChart(series) {
  const root = document.createElement("div");
  root.className = "portfolio-chart";

  if (!series.length) {
    root.innerHTML = `<div class="state-block">No priced holdings yet — add cards with market history to see portfolio performance.</div>`;
    return root;
  }

  let periodDays = 365;

  const head = document.createElement("div");
  head.className = "portfolio-chart__head";
  const quote = document.createElement("div");
  head.appendChild(quote);
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

  const wrap = document.createElement("div");
  wrap.className = "ticker-svg-wrap";
  root.appendChild(wrap);

  const meta = document.createElement("div");
  meta.className = "market-read";
  meta.style.marginTop = "10px";
  root.appendChild(meta);

  function draw() {
    wrap.innerHTML = "";

    const end = dateMs(series[series.length - 1].date);
    const start = periodDays ? end - periodDays * 86400000 : dateMs(series[0].date);
    let rows = series.filter((s) => dateMs(s.date) >= start && dateMs(s.date) <= end);
    if (!rows.length) rows = [series[series.length - 1]];

    const latest = rows[rows.length - 1];
    const first = rows[0];
    const changeAbs = latest.total_value - first.total_value;
    const changePct = first.total_value ? (changeAbs / first.total_value) * 100 : 0;
    const up = changeAbs >= 0;

    quote.innerHTML = `
      <div class="portfolio-chart__value">${money(latest.total_value)}</div>
      <div class="portfolio-chart__change ${up ? "up" : "down"}">
        ${up ? "▲" : "▼"} ${money(Math.abs(changeAbs))} (${Math.abs(changePct).toFixed(1)}%)
        <span class="portfolio-chart__period">this period</span>
      </div>
    `;

    const vals = rows.map((r) => r.total_value);
    const ymin = Math.max(0, Math.floor((Math.min(...vals) * 0.9) / 100) * 100);
    const ymax = Math.ceil((Math.max(...vals) * 1.08) / 100) * 100;
    const span = Math.max(1, dateMs(rows[rows.length - 1].date) - dateMs(rows[0].date));
    const rowStart = dateMs(rows[0].date);
    const X = (x) => L + ((W - L - R) * (x - rowStart)) / span;
    const Y = (y) => T + (H - T - B) * (1 - (y - ymin) / Math.max(1, ymax - ymin));

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.style.width = "100%";
    svg.style.display = "block";

    const grid = document.createElementNS(svgNS, "g");
    for (let i = 0; i < 4; i++) {
      const y = T + ((H - T - B) * i) / 3;
      const v = ymax - ((ymax - ymin) * i) / 3;
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
    const tickCount = Math.min(6, rows.length);
    for (let i = 0; i < tickCount; i++) {
      const ms = rowStart + (span * i) / Math.max(1, tickCount - 1);
      const x = X(ms);
      const anchor = i === 0 ? "start" : i === tickCount - 1 ? "end" : "middle";
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", x); text.setAttribute("y", H - 12);
      text.setAttribute("text-anchor", anchor);
      text.setAttribute("font-size", "11"); text.setAttribute("fill", "#8a8a92");
      text.textContent = axisLabel(ms, periodDays);
      grid.appendChild(text);
    }
    svg.appendChild(grid);

    const lineColor = up ? "#1a8f5a" : "#c23b3b";
    const linePath = rows.map((r, i) => `${i ? "L" : "M"}${X(dateMs(r.date))} ${Y(r.total_value)}`).join(" ");

    const defs = document.createElementNS(svgNS, "defs");
    const gradId = "pf-grad-" + Math.random().toString(36).slice(2, 8);
    defs.innerHTML = `<linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
    </linearGradient>`;
    svg.appendChild(defs);

    const areaPath = document.createElementNS(svgNS, "path");
    areaPath.setAttribute("fill", `url(#${gradId})`);
    areaPath.setAttribute("stroke", "none");
    areaPath.setAttribute("d", `${linePath} L${X(dateMs(rows[rows.length - 1].date))} ${H - B} L${X(dateMs(rows[0].date))} ${H - B} Z`);
    svg.appendChild(areaPath);

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", lineColor);
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("d", linePath);
    svg.appendChild(path);

    const tooltip = document.createElement("div");
    tooltip.className = "ticker-tooltip";
    wrap.appendChild(tooltip);

    rows.forEach((r) => {
      const cx = X(dateMs(r.date));
      const cy = Y(r.total_value);
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("r", 8);
      dot.setAttribute("fill", "transparent");
      dot.style.cursor = "pointer";
      dot.addEventListener("mouseenter", () => {
        tooltip.innerHTML = `${shortDate(r.date)}<br><b>${money(r.total_value)}</b> · ${r.priced_count} priced card${r.priced_count === 1 ? "" : "s"}`;
        tooltip.style.left = `${(cx / W) * 100}%`;
        tooltip.style.top = `${(cy / H) * 100}%`;
        tooltip.classList.add("visible");
      });
      dot.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      svg.appendChild(dot);
    });

    wrap.appendChild(svg);
    meta.textContent = `Reconstructed from real completed sales at each date — not projected. ${rows.length} priced checkpoint${rows.length === 1 ? "" : "s"} in this period.`;
  }

  draw();
  return root;
}
