import { CardImage } from "./CardImage.js";
import { StatusBadge, GBadge } from "./Badges.js";
import { money } from "../format.js";
import { EmptyState } from "./States.js";

function initialsFor(title) {
  return title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function CollectionGrid(items) {
  const root = document.createElement("div");

  if (!items.length) {
    root.appendChild(EmptyState("Your collection is empty — scan or add a card to get started."));
    return root;
  }

  const grid = document.createElement("div");
  grid.className = "card-grid";

  items.forEach((item) => {
    const card = item.card;
    const tile = document.createElement("a");
    tile.className = "card-tile";
    tile.href = `/card.html?id=${encodeURIComponent(card.card_id)}`;

    const media = document.createElement("div");
    media.className = "card-tile__media";
    const badges = document.createElement("div");
    badges.className = "card-tile__badges";
    if (item.status) badges.appendChild(StatusBadge(item.status));
    const g = GBadge(card.rating);
    if (g) badges.appendChild(g);
    media.appendChild(badges);
    media.appendChild(CardImage({ src: card.front_image, alt: card.title, initials: initialsFor(card.title) }));
    tile.appendChild(media);

    const body = document.createElement("div");
    body.className = "card-tile__body";
    body.innerHTML = `
      <div class="card-tile__title">${card.title}</div>
      <div class="card-tile__meta">${card.year} ${card.manufacturer} ${card.product} · ${item.grade || card.grade}</div>
    `;
    const valueRow = document.createElement("div");
    valueRow.className = "card-tile__value";
    if (card.estimate.insufficient_data) {
      valueRow.innerHTML = `<span class="card-tile__estimate--unknown">Estimate unavailable</span>`;
    } else {
      valueRow.innerHTML = `<span class="card-tile__estimate">${money(card.estimate.estimate)}</span>`;
    }
    body.appendChild(valueRow);
    tile.appendChild(body);

    grid.appendChild(tile);
  });

  root.appendChild(grid);
  return root;
}
