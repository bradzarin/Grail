import { money, shortDate } from "../format.js";
import { api } from "../api.js";
import { showToast } from "../toast.js";
import { GRADE_TABS } from "../grades.js";

const PERIODS = [
  ["30D", 30],
  ["90D", 90],
  ["1Y", 365],
  ["2Y", 730],
  ["ALL", null],
];

// GRADE_TABS (grades.js) covers Raw/PSA/BGS/SGC/CGC/Other. Only the card's
// actual stored grade has sales — switching to another tab honestly shows the
// empty state rather than fabricating a curve, per HANDOFF.md section 5
// ("sparse data stays sparse").

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
//
// onCompAdded (optional): called after a manual comp is successfully saved, so
// the caller can refresh anything derived from this card's estimate/rating that
// this component doesn't own (see docs/ARCHITECTURE.md section E on why manual
// comps exist instead of live scrapers for eBay/PSA/Heritage/etc.).
export function MarketTicker(cardId, cardGrade, initialSales, onCompAdded) {
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
  const addCompBtn = document.createElement("button");
  addCompBtn.className = "filter-pill";
  addCompBtn.textContent = "+ Add Comp";
  addCompBtn.addEventListener("click", () => {
    compForm.hidden = !compForm.hidden;
    addCompBtn.classList.toggle("active", !compForm.hidden);
    if (!compForm.hidden) loadCompForm();
  });
  head.appendChild(addCompBtn);
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

  const compForm = document.createElement("div");
  compForm.className = "comp-form";
  compForm.hidden = true;
  root.appendChild(compForm);
  let compSources = null;

  async function loadCompForm() {
    if (compSources) return; // already built
    compForm.innerHTML = `<div class="state-block" style="padding:20px"><div class="spinner"></div>Loading sources…</div>`;
    try {
      compSources = await api.getCompSources();
    } catch (err) {
      compForm.innerHTML = "";
      compForm.appendChild(emptyBlock(`Couldn't load comp sources — ${err.message}`));
      return;
    }
    renderCompForm();
  }

  function renderCompForm() {
    const today = new Date().toISOString().slice(0, 10);
    const fieldStyle = "display:block;margin-top:4px;border:1px solid var(--border-strong);border-radius:6px;padding:7px 10px;font-size:13px;width:100%";
    compForm.innerHTML = `
      <div class="comp-form__grid">
        <label style="font-size:12px;color:var(--ink-soft)">Source
          <select id="comp-source" style="${fieldStyle}">
            ${compSources.map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </label>
        <label style="font-size:12px;color:var(--ink-soft)">Grade
          <select id="comp-grade" style="${fieldStyle}">
            ${GRADE_TABS.map((g) => `<option value="${g}" ${g === grade ? "selected" : ""}>${g}</option>`).join("")}
          </select>
        </label>
        <label style="font-size:12px;color:var(--ink-soft)">Sale date
          <input id="comp-date" type="date" max="${today}" value="${today}" style="${fieldStyle}" />
        </label>
        <label style="font-size:12px;color:var(--ink-soft)">Sale price
          <input id="comp-price" type="number" min="0.01" step="0.01" placeholder="0.00" style="${fieldStyle}" />
        </label>
        <label style="font-size:12px;color:var(--ink-soft);grid-column:1/-1">Listing URL <span style="color:var(--ink-faint)">(optional, but recommended for auditability)</span>
          <input id="comp-url" type="url" placeholder="https://…" style="${fieldStyle}" />
        </label>
      </div>
      <div class="market-read" style="margin-top:10px">
        You looked this sale up yourself — it saves as <b>unverified</b> until someone can audit it
        against the source, same as any other unaudited observation.
      </div>
      <div style="margin-top:12px;display:flex;gap:10px">
        <button class="action-btn" id="comp-submit" style="max-width:180px">Save Comp</button>
        <button class="action-btn action-btn--secondary" id="comp-cancel" style="max-width:120px">Cancel</button>
      </div>
    `;
    compForm.querySelector("#comp-cancel").addEventListener("click", () => {
      compForm.hidden = true;
      addCompBtn.classList.remove("active");
    });
    compForm.querySelector("#comp-submit").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const sold_at = compForm.querySelector("#comp-date").value;
      const price = parseFloat(compForm.querySelector("#comp-price").value);
      const venue = compForm.querySelector("#comp-source").value;
      const compGrade = compForm.querySelector("#comp-grade").value;
      const source_url = compForm.querySelector("#comp-url").value.trim();
      if (!sold_at || !(price > 0)) {
        showToast("Enter a valid sale date and price.");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const result = await api.addComp(cardId, { sold_at, price, venue, grade: compGrade, source_url: source_url || undefined });
        if (result.duplicate) {
          showToast("That exact sale is already on record.");
        } else {
          showToast(`Saved — ${venue}, ${money(price)} on ${sold_at}.`);
          if (compGrade === grade) {
            sales = result.trend.sales || [];
            draw();
          }
          // result.card's estimate/rating are always computed against the card's
          // canonical grade (cardGrade, fixed at mount) — only relevant to the
          // caller when the comp itself was entered at that same grade.
          if (compGrade === cardGrade && typeof onCompAdded === "function") onCompAdded(result.card);
        }
        compForm.hidden = true;
        addCompBtn.classList.remove("active");
      } catch (err) {
        showToast(`Couldn't save that comp — ${err.message}`);
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Comp";
      }
    });
  }

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
