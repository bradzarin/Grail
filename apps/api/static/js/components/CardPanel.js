import { CardArt } from "./CardArt.js";
import { GBadge } from "./Badges.js";
import { GrailEstimatePanel } from "./GrailEstimatePanel.js";
import { MarketTicker } from "./MarketTicker.js";
import { isWanted, toggleWant } from "../wants.js";
import { showToast } from "../toast.js";

function aboutText(card) {
  const bits = [];
  if (card.rookie) bits.push("rookie card");
  if (card.autograph) bits.push("on-card autograph");
  if (card.relic) bits.push("relic card");
  const kind = bits.length ? bits.join(", ") : "card";
  const serial = card.serial_number ? ` numbered ${card.serial_number}` : "";
  return `The ${card.title} is a ${card.year} ${card.manufacturer} ${card.product} ${kind}${serial} from the ${card.set_name} ${card.parallel ? card.parallel + " " : ""}line, part of ${card.player}'s ${card.sport.toLowerCase()} catalog${card.team ? ` (${card.team})` : ""}.`;
}

function popStat(label, value) {
  const div = document.createElement("div");
  div.innerHTML = `<div class="estimate-stat__label">${label}</div><div class="estimate-stat__value">${value ?? "—"}</div>`;
  return div;
}

// Card hero + Grail Estimate + Market Trends terminal, shared by the Home
// dashboard's featured-card spotlight and the standalone Card Market Terminal
// (card.html). See docs/ARCHITECTURE.md section B — one implementation, reused.
export function CardPanel(card, trend, owned) {
  const grid = document.createElement("div");
  grid.className = "terminal-grid";

  const left = document.createElement("div");
  const hero = document.createElement("div");
  hero.className = "terminal-hero";
  hero.appendChild(CardArt(card));
  left.appendChild(hero);

  const identity = document.createElement("div");
  identity.className = "terminal-identity";
  identity.innerHTML = `
    <div class="meta" style="margin-bottom:2px">${card.year} ${card.manufacturer} ${card.product}${card.team ? " · " + card.team : ""}</div>
    <h1><a href="/card.html?id=${encodeURIComponent(card.card_id)}" style="color:inherit">${card.player}</a></h1>
    <div class="meta">${card.set_name}${card.parallel ? " · " + card.parallel : ""}${card.serial_number ? " · " + card.serial_number : ""} · ${card.grade}</div>
  `;
  left.appendChild(identity);

  const tagRow = document.createElement("div");
  tagRow.className = "tag-row";
  const g = GBadge(card.rating);
  if (g) tagRow.appendChild(g);
  const badgeSource = [card.rookie && "Rookie", card.autograph && "Auto", card.relic && "Relic", ...card.tags].filter(Boolean);
  badgeSource.forEach((t) => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = t;
    tagRow.appendChild(pill);
  });
  left.appendChild(tagRow);

  left.appendChild(GrailEstimatePanel(card.estimate));

  const actions = document.createElement("div");
  actions.className = "action-row";
  if (owned) {
    actions.innerHTML = `
      <button class="action-btn" data-act="comps">VIEW COMPS</button>
      <button class="action-btn action-btn--secondary" data-act="wantlist">${isWanted(card.card_id) ? "★ ON WANTLIST" : "ADD TO WANTLIST"}</button>
      <button class="action-btn action-btn--secondary" data-act="market">SEARCH MARKET</button>
    `;
  } else {
    actions.innerHTML = `
      <button class="action-btn" data-act="buy">BUY NOW</button>
      <button class="action-btn action-btn--secondary" data-act="offer">MAKE OFFER</button>
      <button class="action-btn action-btn--secondary" data-act="trade">TRADE</button>
    `;
  }
  left.appendChild(actions);

  const note = document.createElement("div");
  note.className = "action-note";
  note.textContent = owned
    ? "This card is in your Collection."
    : "Settlement (payments/escrow) ships with the Marketplace milestone — these actions preview the flow.";
  left.appendChild(note);

  actions.addEventListener("click", (e) => {
    const act = e.target?.dataset?.act;
    if (!act) return;
    if (act === "comps") {
      grid.querySelector(".ticker-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (act === "wantlist") {
      const nowWanted = toggleWant(card.card_id);
      e.target.textContent = nowWanted ? "★ ON WANTLIST" : "ADD TO WANTLIST";
      showToast(nowWanted ? "Added to your Wantlist" : "Removed from your Wantlist");
    } else if (act === "market") {
      location.href = `/market.html?q=${encodeURIComponent(card.player)}`;
    } else if (act === "buy" || act === "offer" || act === "trade") {
      showToast("Commerce ships with the Marketplace milestone — this is a preview.");
    }
  });

  const about = document.createElement("div");
  about.innerHTML = `<h2 style="font-size:15px;margin:28px 0 8px">About This Card</h2><p style="font-size:13px;color:var(--ink-soft);line-height:1.6;margin:0">${aboutText(card)}</p>`;
  left.appendChild(about);

  const popRow = document.createElement("div");
  popRow.className = "estimate-panel__stats";
  popRow.style.marginTop = "16px";
  popRow.appendChild(popStat("Population (PSA 10)", card.population_psa10?.toLocaleString()));
  popRow.appendChild(popStat("Population (all graded)", card.population_all_graded?.toLocaleString()));
  popRow.appendChild(popStat("Print run", card.print_run ? card.print_run.toLocaleString() : "—"));
  popRow.appendChild(popStat("Released", card.released));
  left.appendChild(popRow);

  const right = document.createElement("div");
  right.appendChild(MarketTicker(card.card_id, card.grade, trend.sales || []));

  grid.appendChild(left);
  grid.appendChild(right);
  return grid;
}
