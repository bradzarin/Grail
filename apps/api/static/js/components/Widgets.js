import { money } from "../format.js";
import { CardImage } from "./CardImage.js";

function initialsFor(title) {
  return title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function thumb(card) {
  const a = document.createElement("a");
  a.className = "thumb";
  a.href = `/card.html?id=${encodeURIComponent(card.card_id)}`;
  a.appendChild(CardImage({ src: card.front_image, alt: card.title, initials: initialsFor(card.title) }));
  return a;
}

export function CollectionWidget(summary, items) {
  const card = document.createElement("div");
  card.className = "widget-card";
  card.innerHTML = `<div class="widget-card__head"><h3>My Collection</h3><a href="/collection.html">View all</a></div>`;

  const stats = document.createElement("div");
  stats.className = "collection-widget__stats";
  stats.innerHTML = `
    <div><b>${summary.card_count}</b><span>Cards</span></div>
    <div><b>${summary.grail_count}</b><span>Grails</span></div>
    <div><b>${summary.total_estimated_value !== null ? money(summary.total_estimated_value) : "—"}</b><span>Est. Value</span></div>
  `;
  card.appendChild(stats);

  const strip = document.createElement("div");
  strip.className = "thumb-strip";
  items.slice(0, 4).forEach((i) => strip.appendChild(thumb(i.card)));
  if (items.length > 4) {
    const more = document.createElement("div");
    more.className = "thumb-more";
    more.style.width = "48px";
    more.style.height = "64px";
    more.style.borderRadius = "6px";
    more.textContent = `+${items.length - 4}`;
    strip.appendChild(more);
  }
  card.appendChild(strip);
  return card;
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
