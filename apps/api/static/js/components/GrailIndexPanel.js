const DIM_LABELS = [
  ["caliber", "Caliber"],
  ["performance", "Performance"],
  ["diversification", "Diversification"],
  ["depth", "Depth"],
  ["liquidity", "Liquidity"],
];

const BAND_COPY = {
  MASTER: "MASTER COLLECTOR",
  SERIOUS: "SERIOUS COLLECTOR",
  BUILDING: "BUILDING",
  STARTER: "STARTER",
};

// The Grail Index — portfolio-level, deliberately not just an average of
// owned cards' G Scores. Reuses the same rating-tile/rating-dim visual
// language as GrailRatingPanel.js (a card's G Score) so the two read as one
// family, but the dimensions and band names are genuinely different —
// Depth in particular has no equivalent at the card level at all. See
// app/grail_index.py.
export function GrailIndexPanel(index) {
  const root = document.createElement("div");
  root.className = "rating-panel";

  const has = index.composite !== null;
  root.innerHTML = `
    <p class="rating-panel__intro">
      The Grail Index scores your whole collection — not an average of what you own, but how
      well you own it. Caliber and Performance ask what it's worth; Diversification and
      Liquidity ask how sound it is; Depth asks how far you've actually gone with the players
      and sets you collect.
    </p>
  `;

  const body = document.createElement("div");
  body.className = "rating-panel__body";

  const tile = document.createElement("div");
  tile.className = `rating-tile${has ? "" : " rating-tile--unrated"}`;
  tile.innerHTML = `
    <div class="rating-tile__letter" style="font-size:22px">INDEX</div>
    <div class="rating-tile__score">${has ? index.composite : "—"}</div>
  `;
  body.appendChild(tile);

  const dims = document.createElement("div");
  dims.className = "rating-panel__dims";
  DIM_LABELS.forEach(([key, label]) => {
    const dim = index.dimensions[key];
    const score = dim.score;
    const row = document.createElement("div");
    row.className = "rating-dim";
    row.title = dim.note;
    row.innerHTML = `
      <span class="rating-dim__label">${label.toUpperCase()}</span>
      <div class="rating-dim__track"><div class="rating-dim__bar" style="width:${score ?? 0}%"></div></div>
      <span class="rating-dim__score">${score ?? "—"}</span>
    `;
    dims.appendChild(row);
  });
  body.appendChild(dims);
  root.appendChild(body);

  const footnote = document.createElement("div");
  footnote.className = "rating-panel__footnote";
  footnote.textContent = has
    ? `${BAND_COPY[index.band] || index.band} · Index v${index.version}.`
    : `Not enough owned cards with cost basis yet to score a portfolio. Index v${index.version}.`;
  root.appendChild(footnote);

  return root;
}
