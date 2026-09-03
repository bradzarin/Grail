// Generated card face — a uniform, original design system instead of real card
// photography. Real trading-card scans are the manufacturer's/photographer's
// copyrighted work; the founder's own handoff flags this exact issue ("use
// properly licensed/authorized imagery in production" — HANDOFF.md section 14/15).
// This renders every card through the same deterministic template — with foil,
// grain and studio-light treatment for a premium, "photographed" feel — so the
// catalog looks like one coherent product instead of mismatched stock photos.

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

// Shared <defs> — gradients/filters reused by both the plain card face and the
// slab-window rendering below. All ids are per-card to avoid collisions when many
// cards render on one page.
function defsBlock(id, primary, secondary) {
  return `
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="55%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="${id}-scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.66"/>
    </linearGradient>
    <radialGradient id="${id}-vignette" cx="50%" cy="38%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.4"/>
    </radialGradient>
    <linearGradient id="${id}-sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="42%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#fff" stop-opacity="0.32"/>
      <stop offset="58%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id}-holo" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#17c3d6"/>
      <stop offset="35%" stop-color="#6d5bff"/>
      <stop offset="65%" stop-color="#e23fa0"/>
      <stop offset="100%" stop-color="#f5c451"/>
    </linearGradient>
    <pattern id="${id}-stripes" width="26" height="26" patternTransform="rotate(28)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="26" stroke="#ffffff" stroke-opacity="0.06" stroke-width="8"/>
    </pattern>
    <filter id="${id}-grain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="matrix"
        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/>
    </filter>
    <filter id="${id}-textShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.45"/>
    </filter>`;
}

// The actual card face — background, texture, big number/initials watermark,
// set tag, sport glyph and name plate — drawn inside whatever box the caller
// gives it (full-bleed for a raw card, or a smaller inset window for a slab).
function faceGroup(card, id, w, h) {
  const icon = SPORT_ICON[card.sport] || "";
  const label = card.jersey_number ? `#${card.jersey_number}` : initialsFor(card.player);
  const bigLabelSize = (card.jersey_number ? 0.56 : 0.43) * w;
  const rx = w * 0.05;
  const plateH = h * 0.29;
  const tagW = (card.year || "").length * 6.4 + (card.product || "").length * 6.4 + 30;

  return `
    <clipPath id="${id}-clip"><rect x="0" y="0" width="${w}" height="${h}" rx="${rx}"/></clipPath>
    <g clip-path="url(#${id}-clip)">
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id}-bg)"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id}-stripes)"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id}-holo)" opacity="0.1" style="mix-blend-mode:overlay"/>
      <rect x="0" y="0" width="${w}" height="${h}" filter="url(#${id}-grain)"/>

      <text x="${w / 2}" y="${h * 0.5}" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia, 'Iowan Old Style', serif" font-weight="700"
            font-size="${bigLabelSize}" fill="#ffffff" fill-opacity="0.15"
            filter="url(#${id}-textShadow)">${label}</text>

      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id}-vignette)"/>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id}-sheen)"/>

      <g transform="translate(${w - 0.113 * w},${h * 0.086})">${icon}</g>

      <rect x="${w * 0.053}" y="${h * 0.038}" rx="7" ry="7" width="${tagW}" height="${h * 0.052}"
            fill="#000" fill-opacity="0.3"/>
      <text x="${w * 0.087}" y="${h * 0.074}" font-family="Inter, sans-serif" font-size="${w * 0.037}" font-weight="700"
            letter-spacing="0.03em" fill="#ffffff" fill-opacity="0.92">${card.year || ""} ${card.product || ""}</text>

      <rect x="0" y="${h - plateH}" width="${w}" height="${plateH}" fill="url(#${id}-scrim)"/>
      <text x="${w * 0.067}" y="${h - plateH * 0.42}" font-family="Georgia, 'Iowan Old Style', serif" font-weight="700"
            font-size="${w * 0.077}" fill="#ffffff" filter="url(#${id}-textShadow)">${card.player}</text>
      <text x="${w * 0.067}" y="${h - plateH * 0.16}" font-family="Inter, sans-serif" font-size="${w * 0.042}"
            fill="#ffffff" fill-opacity="0.85">${card.team || card.set_name}</text>

      <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${rx}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.5"/>
    </g>`;
}

// Graded cards (grade starting "PSA") render inside a slab holder — a
// recognizable hobby convention — instead of the bare card. Not a real PSA
// design, just the general shape: light holder, label header, grade number.
function slabSVG(card, id) {
  const label = card.grade.toUpperCase();
  const gradeNum = label.replace(/[^0-9.]/g, "") || "—";
  const innerX = 18, innerY = 62, innerW = 264, innerH = 336;

  return `
<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${card.title}">
  <defs>
    ${defsBlock(id, card.primary_color || "#6d5bff", card.secondary_color || "#17c3d6")}
    <linearGradient id="${id}-holder" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbfbfd"/>
      <stop offset="100%" stop-color="#e7e7ec"/>
    </linearGradient>
    <linearGradient id="${id}-label" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#171a2b"/>
      <stop offset="100%" stop-color="#2c3157"/>
    </linearGradient>
  </defs>

  <rect x="1" y="1" width="298" height="418" rx="14" fill="url(#${id}-holder)" stroke="#c9c9d2" stroke-width="1.5"/>
  <rect x="9" y="9" width="282" height="402" rx="10" fill="none" stroke="#d6d6dd" stroke-width="1"/>

  <rect x="18" y="18" width="264" height="36" rx="6" fill="url(#${id}-label)"/>
  <text x="30" y="41" font-family="Inter, sans-serif" font-size="14" font-weight="800" letter-spacing="0.06em" fill="#fff">GRAIL GRADED</text>
  <circle cx="255" cy="36" r="15" fill="#f5c451"/>
  <text x="255" y="41" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#171a2b">${gradeNum}</text>

  <g transform="translate(${innerX},${innerY})">
    ${faceGroup(card, id, innerW, innerH)}
  </g>

  <text x="150" y="410" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" letter-spacing="0.08em" fill="#9a9aa4">${label} · CERT DEMO-${(card.card_id || "").slice(-6).toUpperCase()}</text>
</svg>`.trim();
}

function plainSVG(card, id) {
  return `
<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${card.title}">
  <defs>${defsBlock(id, card.primary_color || "#6d5bff", card.secondary_color || "#17c3d6")}</defs>
  ${faceGroup(card, id, 300, 420)}
</svg>`.trim();
}

export function cardArtSVG(card) {
  const id = safeId(card.card_id);
  const isGraded = !!(card.grade && card.grade.toUpperCase().startsWith("PSA"));
  return isGraded ? slabSVG(card, id) : plainSVG(card, id);
}

function renderGenerated(wrap, card) {
  wrap.innerHTML = cardArtSVG(card);
  const svg = wrap.querySelector("svg");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.display = "block";
}

// photoUrl: a real photo of this specific owned copy (CARD_INSTANCE.front_image,
// uploaded via POST /api/collection/{id}/photo — see HANDOFF.md section 12). When
// present, it's used in place of the generated art; a broken/failed load falls back
// to the generated card rather than showing a broken image (HANDOFF.md section 14,
// "Image Reliability"). Catalog-wide views (Grails, Discover, Suggested Pickups)
// don't have a specific owned copy to photograph, so they always render generated.
export function CardArt(card, photoUrl) {
  const wrap = document.createElement("div");
  wrap.style.width = "100%";
  wrap.style.height = "100%";

  if (photoUrl) {
    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = card.title;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";
    img.addEventListener("error", () => renderGenerated(wrap, card), { once: true });
    wrap.appendChild(img);
    return wrap;
  }

  renderGenerated(wrap, card);
  return wrap;
}
