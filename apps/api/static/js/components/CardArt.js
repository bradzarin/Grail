// Generated card face — a uniform, original design system instead of real card
// photography. Real trading-card scans are the manufacturer's/photographer's
// copyrighted work; the founder's own handoff flags this exact issue ("use
// properly licensed/authorized imagery in production" — HANDOFF.md section 14/15).
// This renders every card through the same deterministic template so the catalog
// looks like one coherent product instead of mismatched stock photos.

const SPORT_ICON = {
  Basketball: '<circle cx="0" cy="0" r="13" fill="none" stroke="white" stroke-width="1.4" opacity="0.85"/><path d="M-13 0h26M0-13v26M-9.5-9.5c5 5 5 14 0 19M9.5-9.5c-5 5-5 14 0 19" fill="none" stroke="white" stroke-width="1.2" opacity="0.85"/>',
  Soccer: '<circle cx="0" cy="0" r="13" fill="none" stroke="white" stroke-width="1.4" opacity="0.85"/><path d="M0-13 6-9 9 3 0 9 -9 3 -6-9Z" fill="none" stroke="white" stroke-width="1" opacity="0.7"/>',
  Baseball: '<circle cx="0" cy="0" r="13" fill="none" stroke="white" stroke-width="1.4" opacity="0.85"/><path d="M-11-6c4 4 4 14 0 18M11-6c-4 4-4 14 0 18" fill="none" stroke="white" stroke-width="1.1" opacity="0.85"/>',
};

function initialsFor(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function safeId(cardId) {
  return "ca-" + cardId.replace(/[^a-z0-9]/gi, "");
}

export function cardArtSVG(card) {
  const id = safeId(card.card_id);
  const primary = card.primary_color || "#6d5bff";
  const secondary = card.secondary_color || "#17c3d6";
  const icon = SPORT_ICON[card.sport] || "";
  const label = card.jersey_number ? `#${card.jersey_number}` : initialsFor(card.player);
  const bigLabelSize = card.jersey_number ? 168 : 128;

  return `
<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${card.title}">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="${id}-scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.62"/>
    </linearGradient>
    <pattern id="${id}-stripes" width="26" height="26" patternTransform="rotate(28)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="26" stroke="#ffffff" stroke-opacity="0.07" stroke-width="8"/>
    </pattern>
  </defs>

  <rect x="1.5" y="1.5" width="297" height="417" rx="16" fill="url(#${id}-bg)"/>
  <rect x="1.5" y="1.5" width="297" height="417" rx="16" fill="url(#${id}-stripes)"/>

  <text x="150" y="210" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia, 'Iowan Old Style', serif" font-weight="700"
        font-size="${bigLabelSize}" fill="#ffffff" fill-opacity="0.16">${label}</text>

  <g transform="translate(266,36)">${icon}</g>

  <rect x="16" y="16" rx="8" ry="8" width="${(card.year || "").length * 7 + (card.product || "").length * 7 + 34}" height="22"
        fill="#000" fill-opacity="0.28"/>
  <text x="26" y="31" font-family="Inter, sans-serif" font-size="11" font-weight="700"
        letter-spacing="0.03em" fill="#ffffff" fill-opacity="0.92">${card.year || ""} ${card.product || ""}</text>

  <rect x="0" y="300" width="300" height="120" rx="16" fill="url(#${id}-scrim)"/>
  <text x="20" y="374" font-family="Georgia, 'Iowan Old Style', serif" font-weight="700"
        font-size="23" fill="#ffffff">${card.player}</text>
  <text x="20" y="396" font-family="Inter, sans-serif" font-size="12.5" fill="#ffffff" fill-opacity="0.82">${card.team || card.set_name}</text>

  <rect x="1.5" y="1.5" width="297" height="417" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.5"/>
</svg>`.trim();
}

export function CardArt(card) {
  const wrap = document.createElement("div");
  wrap.style.width = "100%";
  wrap.style.height = "100%";
  wrap.innerHTML = cardArtSVG(card);
  const svg = wrap.querySelector("svg");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";
  return wrap;
}
