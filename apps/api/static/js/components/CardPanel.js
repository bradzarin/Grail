import { api } from "../api.js";
import { CardArt } from "./CardArt.js";
import { GBadge, LiquidityBadge } from "./Badges.js";
import { GrailEstimatePanel } from "./GrailEstimatePanel.js";
import { GrailRatingPanel } from "./GrailRatingPanel.js";
import { MarketTicker } from "./MarketTicker.js";
import { isWanted, toggleWant } from "../wants.js";
import { showToast } from "../toast.js";

function popStat(label, value) {
  const div = document.createElement("div");
  div.innerHTML = `<div class="estimate-stat__label">${label}</div><div class="estimate-stat__value">${value ?? "—"}</div>`;
  return div;
}

// Card hero + Grail Estimate + Market Trends terminal for the standalone Card
// Market Terminal (card.html). See docs/ARCHITECTURE.md section B.
export function CardPanel(card, trend, owned) {
  const grid = document.createElement("div");
  grid.className = "terminal-grid";

  const left = document.createElement("div");
  const hero = document.createElement("div");
  hero.className = "terminal-hero";
  hero.appendChild(CardArt(card, owned?.front_image));
  left.appendChild(hero);

  // Real photo of this specific owned copy (HANDOFF.md section 12,
  // CARD_INSTANCE.front_image) — only offered when this card is actually
  // owned, since there's no specific physical copy to photograph otherwise.
  const photoSlot = document.createElement("div");
  function renderPhotoRow() {
    photoSlot.innerHTML = "";
    if (!owned) return;
    const row = document.createElement("div");
    row.className = "photo-upload-row";

    const label = document.createElement("label");
    label.className = "filter-pill photo-upload-btn";
    label.textContent = owned.front_image ? "Replace Photo" : "Upload Your Photo";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.hidden = true;
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      label.textContent = "Uploading…";
      try {
        const updated = await api.uploadInstancePhoto(owned.instance_id, "front", file);
        owned.front_image = updated.front_image;
        hero.innerHTML = "";
        hero.appendChild(CardArt(card, owned.front_image));
        showToast("Photo updated.");
        renderPhotoRow();
      } catch (err) {
        showToast(`Couldn't upload photo — ${err.message}`);
        label.textContent = owned.front_image ? "Replace Photo" : "Upload Your Photo";
      }
    });
    label.appendChild(input);
    row.appendChild(label);

    if (owned.front_image) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "filter-pill";
      removeBtn.textContent = "Remove Photo";
      removeBtn.addEventListener("click", async () => {
        try {
          await api.deleteInstancePhoto(owned.instance_id, "front");
          owned.front_image = null;
          hero.innerHTML = "";
          hero.appendChild(CardArt(card, null));
          showToast("Photo removed — back to generated art.");
          renderPhotoRow();
        } catch (err) {
          showToast(`Couldn't remove photo — ${err.message}`);
        }
      });
      row.appendChild(removeBtn);
    }

    photoSlot.appendChild(row);
  }
  renderPhotoRow();
  left.appendChild(photoSlot);

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
  const gSlot = document.createElement("span");
  tagRow.appendChild(gSlot);
  function renderGBadge(rating) {
    gSlot.innerHTML = "";
    const g = GBadge(rating);
    if (g) gSlot.appendChild(g);
  }
  renderGBadge(card.rating);
  const liquiditySlot = document.createElement("span");
  tagRow.appendChild(liquiditySlot);
  function renderLiquidity(liquidity) {
    liquiditySlot.innerHTML = "";
    liquiditySlot.appendChild(LiquidityBadge(liquidity));
  }
  renderLiquidity(card.liquidity);
  const badgeSource = [card.rookie && "Rookie", card.autograph && "Auto", card.relic && "Relic", ...card.tags].filter(Boolean);
  badgeSource.forEach((t) => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = t;
    tagRow.appendChild(pill);
  });
  left.appendChild(tagRow);

  const estimateSlot = document.createElement("div");
  estimateSlot.appendChild(GrailEstimatePanel(card.estimate));
  left.appendChild(estimateSlot);

  // MarketTicker only calls this when the comp was entered at the card's
  // canonical grade — the only case where the estimate/rating/liquidity/
  // commentary shown here changes.
  function onCompAdded(freshCard) {
    estimateSlot.innerHTML = "";
    estimateSlot.appendChild(GrailEstimatePanel(freshCard.estimate));
    renderGBadge(freshCard.rating);
    renderLiquidity(freshCard.liquidity);
    commentaryEl.textContent = freshCard.commentary;
    ratingSlot.innerHTML = "";
    ratingSlot.appendChild(GrailRatingPanel(freshCard.rating));
  }

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
  about.innerHTML = `<h2 style="font-size:15px;margin:28px 0 8px">About This Card + What The Market Is Saying</h2>`;
  const commentaryEl = document.createElement("p");
  commentaryEl.style.cssText = "font-size:13px;color:var(--ink-soft);line-height:1.6;margin:0";
  commentaryEl.textContent = card.commentary;
  about.appendChild(commentaryEl);
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
  right.appendChild(MarketTicker(card.card_id, card.grade, trend.sales || [], onCompAdded));

  grid.appendChild(left);
  grid.appendChild(right);

  const wrapper = document.createElement("div");
  wrapper.appendChild(grid);

  const ratingSlot = document.createElement("div");
  ratingSlot.style.marginTop = "32px";
  ratingSlot.appendChild(GrailRatingPanel(card.rating));
  wrapper.appendChild(ratingSlot);

  return wrapper;
}
