const DIM_LABELS = [
  ["value", "Value"],
  ["demand", "Demand"],
  ["scarcity", "Scarcity"],
  ["significance", "Significance"],
  ["momentum", "Momentum"],
];

const BAND_COPY = {
  GRAIL: "GRAIL",
  ELITE: "ICONIC",
  NOTABLE: "RISING",
};

// The Grail Rating, broken out — not just the pill. Every number here already
// exists in the API response (valuation.grail_rating); this just makes the
// "why" visible instead of collapsing it into one badge. See
// docs/ARCHITECTURE.md section J.
export function GrailRatingPanel(rating) {
  const root = document.createElement("div");
  root.className = "rating-panel";

  const qualifies = !!rating.band;
  root.innerHTML = `
    <p class="rating-panel__intro">
      The G identifies cards that matter — through value, demand, scarcity, cultural
      significance, or momentum. A $300 vintage insert and a $3,000 modern parallel can
      both earn it, for different reasons.
    </p>
  `;

  const body = document.createElement("div");
  body.className = "rating-panel__body";

  const tile = document.createElement("div");
  tile.className = `rating-tile${qualifies ? "" : " rating-tile--unrated"}`;
  tile.innerHTML = `
    <div class="rating-tile__letter">G</div>
    <div class="rating-tile__score">${rating.composite}</div>
  `;
  body.appendChild(tile);

  const dims = document.createElement("div");
  dims.className = "rating-panel__dims";
  DIM_LABELS.forEach(([key, label]) => {
    const score = rating.dimensions[key];
    const row = document.createElement("div");
    row.className = "rating-dim";
    row.innerHTML = `
      <span class="rating-dim__label">${label.toUpperCase()}</span>
      <div class="rating-dim__track"><div class="rating-dim__bar" style="width:${score}%"></div></div>
      <span class="rating-dim__score">${score}</span>
    `;
    dims.appendChild(row);
  });
  body.appendChild(dims);
  root.appendChild(body);

  const footnote = document.createElement("div");
  footnote.className = "rating-panel__footnote";
  if (qualifies) {
    const badgeSourceNote = rating.band_source === "editorial_override"
      ? "earned on editorial significance — market data is too thin yet to score it on the composite alone"
      : "earned on the composite score above";
    footnote.textContent = `${BAND_COPY[rating.band] || rating.band} (${badgeSourceNote}). Rating v${rating.version}.`;
  } else {
    footnote.textContent = `Below the Grail threshold (70) — shown for transparency, not hidden. Rating v${rating.version}.`;
  }
  root.appendChild(footnote);

  return root;
}
