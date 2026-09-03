import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CollectionGrid } from "../components/CollectionGrid.js";
import { GrailsWidget, SuggestedPickupsWidget, PerformerStrip, DiscoverStrip } from "../components/Widgets.js";
import { PortfolioChart } from "../components/PortfolioChart.js";
import { BreakdownWidget } from "../components/BreakdownWidget.js";
import { GrailIndexPanel } from "../components/GrailIndexPanel.js";
import { LoadingState, ErrorState } from "../components/States.js";
import { money } from "../format.js";

mountShell("home");

function Hero(summary) {
  const div = document.createElement("div");
  div.className = "home-hero";
  div.innerHTML = `
    <img src="/static/assets/the_grail_logo.png" alt="The Grail" onerror="this.remove()" />
    <div class="home-hero__tagline">Know what you own. Find what you love.</div>
    <div class="home-hero__spacer"></div>
    <div class="home-hero__stat">
      <div class="label">Est. Collection Value</div>
      <div class="value">${summary.total_estimated_value !== null ? money(summary.total_estimated_value) : "—"}</div>
    </div>
  `;
  return div;
}

function SummaryStrip(summary) {
  const div = document.createElement("div");
  div.className = "summary-strip";
  const stats = [
    ["Cards", summary.card_count],
    ["Grail-Rated", summary.grail_count],
    ["Cost Basis", money(summary.cost_basis)],
    ["Est. Value", summary.total_estimated_value !== null ? money(summary.total_estimated_value) : "—"],
  ];
  stats.forEach(([label, value]) => {
    const cell = document.createElement("div");
    cell.className = "summary-stat";
    cell.innerHTML = `<div class="summary-stat__label">${label}</div><div class="summary-stat__value">${value}</div>`;
    div.appendChild(cell);
  });
  return div;
}

async function main() {
  const heroEl = document.getElementById("hero");
  const chartEl = document.getElementById("portfolio-chart");
  const summaryEl = document.getElementById("summary");
  const grailIndexEl = document.getElementById("grail-index");
  const performersEl = document.getElementById("performers");
  const breakdownEl = document.getElementById("breakdown");
  const discoverEl = document.getElementById("discover");
  const collectionEl = document.getElementById("collection-preview");
  const widgetsEl = document.getElementById("widgets");

  heroEl.appendChild(LoadingState("Loading your dashboard…"));

  try {
    const [collection, summary, performance, discover, grails, pickups, grailIndex] = await Promise.all([
      api.getCollection(),
      api.getCollectionSummary(),
      api.getCollectionPerformance(),
      api.getDiscover(),
      api.getGrails(),
      api.getSuggestedPickups(),
      api.getGrailIndex(),
    ]);

    heroEl.innerHTML = "";
    heroEl.appendChild(Hero(summary));
    chartEl.appendChild(PortfolioChart(performance));
    summaryEl.appendChild(SummaryStrip(summary));
    grailIndexEl.appendChild(GrailIndexPanel(grailIndex));
    performersEl.appendChild(PerformerStrip(collection));
    breakdownEl.appendChild(BreakdownWidget());
    discoverEl.appendChild(DiscoverStrip(discover));
    collectionEl.appendChild(CollectionGrid(collection.slice(0, 4)));
    widgetsEl.appendChild(GrailsWidget(grails));
    widgetsEl.appendChild(SuggestedPickupsWidget(pickups));
  } catch (err) {
    heroEl.innerHTML = "";
    heroEl.appendChild(ErrorState(`Couldn't load your dashboard — ${err.message}`, main));
  }
}

main();
