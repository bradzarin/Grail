import { money } from "../format.js";
import { CardArt } from "./CardArt.js";

function thumb(card) {
  const a = document.createElement("a");
  a.className = "thumb";
  a.href = `/card.html?id=${encodeURIComponent(card.card_id)}`;
  a.appendChild(CardArt(card));
  return a;
}

// Best Performing Cards: real unrealized gain (current estimate vs. what was
// actually paid), not a vanity ranking. Cards with no market data yet can't be
// ranked and are excluded rather than shown with a fabricated 0%.
export function PerformerStrip(items) {
  const withGain = items
    .map((i) => {
      const est = i.card.estimate.estimate;
      if (!est || !i.acquired_price) return null;
      return { item: i, gainPct: ((est - i.acquired_price) / i.acquired_price) * 100 };
    })
    .filter(Boolean)
    .sort((a, b) => b.gainPct - a.gainPct);

  const root = document.createElement("div");
  if (!withGain.length) {
    root.appendChild((() => {
      const div = document.createElement("div");
      div.className = "state-block";
      div.textContent = "No cards have enough market history yet to compute performance.";
      return div;
    })());
    return root;
  }

  const strip = document.createElement("div");
  strip.className = "performer-strip";
  withGain.forEach(({ item, gainPct }, idx) => {
    const card = item.card;
    const tile = document.createElement("a");
    tile.className = "performer-tile";
    tile.href = `/card.html?id=${encodeURIComponent(card.card_id)}`;

    const media = document.createElement("div");
    media.className = "performer-tile__media";
    media.appendChild(CardArt(card));
    const rank = document.createElement("div");
    rank.className = "performer-tile__rank";
    rank.textContent = String(idx + 1);
    media.appendChild(rank);
    const gainBadge = document.createElement("div");
    const dir = gainPct > 0.5 ? "up" : gainPct < -0.5 ? "down" : "flat";
    gainBadge.className = `performer-tile__gain performer-tile__gain--${dir}`;
    gainBadge.textContent = `${gainPct >= 0 ? "▲" : "▼"} ${Math.abs(gainPct).toFixed(1)}%`;
    media.appendChild(gainBadge);
    tile.appendChild(media);

    const body = document.createElement("div");
    body.className = "performer-tile__body";
    body.innerHTML = `
      <div class="performer-tile__title">${card.title}</div>
      <div class="performer-tile__meta">${money(item.acquired_price)} → ${money(card.estimate.estimate)}</div>
    `;
    tile.appendChild(body);
    strip.appendChild(tile);
  });
  root.appendChild(strip);
  return root;
}

// Discover: real market momentum, personalized to what's already owned — not
// a vanity "trending" list. Cards without enough sales to compute momentum
// are excluded upstream (see portfolio.discover_movers), never shown at 0%.
export function DiscoverStrip(items) {
  const root = document.createElement("div");
  if (!items.length) {
    root.appendChild(Object.assign(document.createElement("div"), {
      className: "state-block",
      textContent: "Not enough sales history yet to surface real movers.",
    }));
    return root;
  }

  const strip = document.createElement("div");
  strip.className = "performer-strip";
  items.slice(0, 8).forEach((row) => {
    const card = row.card;
    const tile = document.createElement("a");
    tile.className = "performer-tile";
    tile.href = `/card.html?id=${encodeURIComponent(card.card_id)}`;

    const media = document.createElement("div");
    media.className = "performer-tile__media";
    media.appendChild(CardArt(card));
    if (row.owned) {
      const owned = document.createElement("div");
      owned.className = "performer-tile__rank";
      owned.style.width = "auto";
      owned.style.padding = "0 8px";
      owned.style.borderRadius = "999px";
      owned.style.fontSize = "9.5px";
      owned.style.letterSpacing = "0.04em";
      owned.textContent = "OWNED";
      media.appendChild(owned);
    }
    const dir = row.momentum_pct > 0.5 ? "up" : row.momentum_pct < -0.5 ? "down" : "flat";
    const badge = document.createElement("div");
    badge.className = `performer-tile__gain performer-tile__gain--${dir}`;
    badge.textContent = `${row.momentum_pct >= 0 ? "▲" : "▼"} ${Math.abs(row.momentum_pct).toFixed(1)}%`;
    media.appendChild(badge);
    tile.appendChild(media);

    const body = document.createElement("div");
    body.className = "performer-tile__body";
    body.innerHTML = `
      <div class="performer-tile__title">${card.title}</div>
      <div class="performer-tile__meta">${row.reason}</div>
    `;
    tile.appendChild(body);
    strip.appendChild(tile);
  });
  root.appendChild(strip);
  return root;
}

export function GrailsWidget(grails) {
  const card = document.createElement("div");
  card.className = "widget-card";
  card.innerHTML = `<div class="widget-card__head"><h3>Grails</h3><a href="/grails.html">View all</a></div>`;

  if (!grails.length) {
    const empty = document.createElement("div");
    empty.style.fontSize = "12px";
    empty.style.color = "var(--ink-faint)";
    empty.textContent = "No Grail-rated cards yet — they appear as market data accumulates.";
    card.appendChild(empty);
    return card;
  }

  const strip = document.createElement("div");
  strip.className = "grail-strip";
  grails.slice(0, 4).forEach((c) => {
    const row = document.createElement("div");
    row.className = "grail-strip-row";
    row.appendChild(thumb(c));
    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `<div class="title">${c.title}</div><div class="sub">${c.year} · ${c.set_name}</div>`;
    row.appendChild(info);
    const price = document.createElement("div");
    price.className = "price";
    price.textContent = c.estimate.estimate ? money(c.estimate.estimate) : "—";
    row.appendChild(price);
    strip.appendChild(row);
  });
  card.appendChild(strip);
  return card;
}

export function SuggestedPickupsWidget(pickups) {
  const card = document.createElement("div");
  card.className = "widget-card";
  card.innerHTML = `<div class="widget-card__head"><h3>Suggested Pickups</h3><a href="/market.html">View all</a></div>`;

  if (!pickups.length) {
    const empty = document.createElement("div");
    empty.style.fontSize = "12px";
    empty.style.color = "var(--ink-faint)";
    empty.textContent = "Nothing to suggest right now — you own the full demo catalog.";
    card.appendChild(empty);
    return card;
  }

  pickups.slice(0, 3).forEach((p) => {
    const row = document.createElement("div");
    row.className = "pickup-row";
    row.appendChild(thumb(p.card));
    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `<div class="title">${p.card.title}</div><div class="reason">${p.reason}</div>`;
    row.appendChild(info);
    const right = document.createElement("div");
    right.className = "right";
    right.innerHTML = `
      <div class="estimate-label">Grail Estimate</div>
      <div class="estimate-value">${p.card.estimate.estimate ? money(p.card.estimate.estimate) : "—"}</div>
      <a class="view-btn" href="/card.html?id=${encodeURIComponent(p.card.card_id)}">View</a>
    `;
    row.appendChild(right);
    card.appendChild(row);
  });
  return card;
}
