import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CardPanel } from "../components/CardPanel.js";
import { ErrorState } from "../components/States.js";

mountShell("market");

const params = new URLSearchParams(location.search);
const cardId = params.get("id") || "mj-scoring-kings-5";

async function main() {
  const root = document.getElementById("terminal");
  root.innerHTML = "";

  let card, trend, collection;
  try {
    [card, trend, collection] = await Promise.all([api.getCard(cardId), api.getTrend(cardId), api.getCollection()]);
  } catch (err) {
    root.appendChild(ErrorState(`Couldn't load this card — ${err.message}`, main));
    return;
  }

  document.title = `${card.title} — The Grail`;
  const owned = collection.find((i) => i.card.card_id === cardId) || null;
  root.appendChild(CardPanel(card, trend, owned));
}

main();
