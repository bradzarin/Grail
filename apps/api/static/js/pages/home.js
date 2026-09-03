import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CardPanel } from "../components/CardPanel.js";
import { CollectionWidget, GrailsWidget, SuggestedPickupsWidget } from "../components/Widgets.js";
import { LoadingState, ErrorState } from "../components/States.js";

mountShell("home");

const FEATURED_CARD_ID = "mj-scoring-kings-5";

async function main() {
  const featuredEl = document.getElementById("featured");
  const widgetsEl = document.getElementById("widgets");
  featuredEl.appendChild(LoadingState("Loading your dashboard…"));

  try {
    const [card, trend, collection, summary, grails, pickups] = await Promise.all([
      api.getCard(FEATURED_CARD_ID),
      api.getTrend(FEATURED_CARD_ID),
      api.getCollection(),
      api.getCollectionSummary(),
      api.getGrails(),
      api.getSuggestedPickups(),
    ]);

    featuredEl.innerHTML = "";
    const owned = collection.find((i) => i.card.card_id === FEATURED_CARD_ID) || null;
    featuredEl.appendChild(CardPanel(card, trend, owned));

    widgetsEl.appendChild(CollectionWidget(summary, collection));
    widgetsEl.appendChild(GrailsWidget(grails));
    widgetsEl.appendChild(SuggestedPickupsWidget(pickups));
  } catch (err) {
    featuredEl.innerHTML = "";
    featuredEl.appendChild(ErrorState(`Couldn't load your dashboard — ${err.message}`, main));
  }
}

main();
