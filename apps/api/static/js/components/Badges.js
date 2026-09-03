export function StatusBadge(status) {
  const span = document.createElement("span");
  span.className = `status-badge status-badge--${status}`;
  span.textContent = status;
  return span;
}

const BAND_LABEL = { GRAIL: "GRAIL", ELITE: "ICONIC", NOTABLE: "RISING" };

export function GBadge(rating) {
  if (!rating || !rating.band) return null;
  const span = document.createElement("span");
  span.className = "g-badge";
  span.title = `Grail Rating ${rating.composite}/100 (v${rating.version})`;
  span.textContent = `G · ${BAND_LABEL[rating.band] || rating.band}`;
  return span;
}

export function LiquidityBadge(liquidity) {
  const span = document.createElement("span");
  span.className = `liquidity-badge liquidity-badge--${liquidity.tier}`;
  span.title = liquidity.note;
  span.textContent = liquidity.label;
  return span;
}

export function ConfidencePill(confidence) {
  const span = document.createElement("span");
  span.className = `confidence-pill confidence-pill--${confidence}`;
  span.textContent = confidence;
  return span;
}
