import { money, shortDate } from "../format.js";

const PERIODS = [
  ["30D", 30],
  ["90D", 90],
  ["1Y", 365],
  ["2Y", 730],
  ["ALL", null],
];

const W = 900, H = 340, L = 64, R = 20, T = 20, B = 44;

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
export function MarketTicker(sales) {
  const root = document.createElement("div");
  root.className = "ticker-card";

  let periodDays = 365;

  const head = document.createElement("div");
  head.className = "ticker-card__head";
  head.innerHTML = `<h2>Completed Sales</h2>`;
  const toggle = document.createElement("div");
  toggle.className = "period-toggle";
  PERIODS.forEach(([label, days]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (days === periodDays) btn.classList.add("active");
    btn.addEventListener("click", () => {
      periodDays = days;
      toggle.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      draw();
    });
    toggle.appendChild(btn);
  });
  head.appendChild(toggle);
  root.appendChild(head);

  const wrap = document.createElement("div");
  wrap.className = "ticker-svg-wrap";
  root.appendChild(wrap);

  const meta = document.createElement("div");
  meta.className = "market-read";
  meta.style.marginTop = "12px";
  root.appendChild(meta);

  function draw() {
    wrap.innerHTML = "";
    meta.textContent = "";

    if (!sales.length) {
      wrap.appendChild(emptyBlock("No completed sales recorded yet for this card."));
      return;
    }

    const end = Math.max(...sales.map((s) => dateMs(s.date)));
    const start = periodDays ? end - periodDays * 86400000 : Math.min(...sales.map((s) => dateMs(s.date)));
    const rows = sales.filter((s) => dateMs(s.date) >= start && dateMs(s.date) <= end);

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
      text.setAttribute("x", x); text.setAttribute("y", H - 16);
      text.setAttribute("text-anchor", anchor);
      text.setAttribute("font-size", "11"); text.setAttribute("fill", "#8a8a92");
      text.textContent = axisLabel(ms, periodDays);
      grid.appendChild(text);
    }
    svg.appendChild(grid);

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#6d5bff");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("d", rows.map((r, i) => `${i ? "L" : "M"}${X(dateMs(r.date))} ${Y(r.price)}`).join(" "));
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

  draw();
  return root;
}
