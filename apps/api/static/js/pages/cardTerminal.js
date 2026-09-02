import { api } from "../api.js";
import { Nav } from "../components/Nav.js";
import { CardImage } from "../components/CardImage.js";
import { GBadge } from "../components/Badges.js";
import { GrailEstimatePanel } from "../components/GrailEstimatePanel.js";
import { MarketTicker } from "../components/MarketTicker.js";
import { withState, ErrorState } from "../components/States.js";

document.getElementById("nav").appendChild(Nav("market"));

const params = new URLSearchParams(location.search);
const cardId = params.get("id") || "mj-scoring-kings-5";

function initialsFor(title) {
  return title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

async function main() {
  const root = document.getElementById("terminal");
  root.innerHTML = "";

  let card, trend;
  try {
    [card, trend] = await Promise.all([api.getCard(cardId), api.getTrend(cardId)]);
  } catch (err) {
    root.appendChild(ErrorState(`Couldn't load this card — ${err.message}`, main));
    return;
  }

  document.title = `${card.title} — The Grail`;

  const grid = document.createElement("div");
  grid.className = "terminal-grid";

  const left = document.createElement("div");
  const hero = document.createElement("div");
  hero.className = "terminal-hero";
  hero.appendChild(CardImage({ src: card.front_image, alt: card.title, initials: initialsFor(card.title) }));
  left.appendChild(hero);

  const identity = document.createElement("div");
  identity.className = "terminal-identity";
  const g = GBadge(card.rating);
  identity.innerHTML = `
    <h1>${card.title}</h1>
    <div class="meta">${card.year} ${card.manufacturer} ${card.product} · ${card.set_name}${card.serial_number ? " · " + card.serial_number : ""} · ${card.grade}</div>
  `;
  if (g) {
    const badgeRow = document.createElement("div");
    badgeRow.style.marginBottom = "14px";
    badgeRow.appendChild(g);
    identity.appendChild(badgeRow);
  }
  left.appendChild(identity);

  left.appendChild(GrailEstimatePanel(card.estimate));

  const actions = document.createElement("div");
  actions.className = "action-row";
  actions.innerHTML = `
    <button class="action-btn" disabled title="Commerce ships in a later phase">BUY</button>
    <button class="action-btn action-btn--secondary" disabled title="Commerce ships in a later phase">OFFER</button>
    <button class="action-btn action-btn--secondary" disabled title="Commerce ships in a later phase">TRADE</button>
  `;
  left.appendChild(actions);
  const note = document.createElement("div");
  note.className = "action-note";
  note.textContent = "Buy / Offer / Trade land with the Marketplace milestone — Collection + Intelligence come first.";
  left.appendChild(note);

  const right = document.createElement("div");
  right.appendChild(MarketTicker(trend.sales || []));

  grid.appendChild(left);
  grid.appendChild(right);

  root.appendChild(grid);
}

main();
