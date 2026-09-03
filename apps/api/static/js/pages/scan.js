import { api } from "../api.js";
import { mountShell } from "../shell.js";
import { CardImage } from "../components/CardImage.js";
import { LoadingState, ErrorState } from "../components/States.js";
import { money } from "../format.js";
import { showToast } from "../toast.js";

mountShell("scan");

function initialsFor(title) {
  return title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

async function main() {
  const root = document.getElementById("scan-root");
  root.appendChild(LoadingState("Loading catalog…"));

  let cards;
  try {
    cards = await api.listCards();
  } catch (err) {
    root.innerHTML = "";
    root.appendChild(ErrorState(`Couldn't load the catalog — ${err.message}`, main));
    return;
  }
  root.innerHTML = "";

  const picker = document.createElement("div");
  picker.className = "card-grid";
  root.appendChild(picker);

  const confirmPanel = document.createElement("div");
  root.appendChild(confirmPanel);

  cards.forEach((card) => {
    const tile = document.createElement("button");
    tile.className = "card-tile";
    tile.style.textAlign = "left";
    tile.style.cursor = "pointer";
    tile.style.border = "1px solid var(--border)";
    const media = document.createElement("div");
    media.className = "card-tile__media";
    media.appendChild(CardImage({ src: card.front_image, alt: card.title, initials: initialsFor(card.title) }));
    tile.appendChild(media);
    const body = document.createElement("div");
    body.className = "card-tile__body";
    body.innerHTML = `<div class="card-tile__title">${card.title}</div><div class="card-tile__meta">Tap to simulate scanning this card</div>`;
    tile.appendChild(body);
    tile.addEventListener("click", () => showConfirm(card));
    picker.appendChild(tile);
  });

  function showConfirm(card) {
    confirmPanel.innerHTML = "";
    const box = document.createElement("div");
    box.className = "estimate-panel";
    box.style.marginTop = "28px";
    box.innerHTML = `
      <h2 style="font-size:15px;margin:0 0 12px">Identified</h2>
      <div class="estimate-panel__stats" style="grid-template-columns:repeat(2,1fr)">
        <div><div class="estimate-stat__label">Player</div><div class="estimate-stat__value">${card.player}</div></div>
        <div><div class="estimate-stat__label">Set</div><div class="estimate-stat__value">${card.year} ${card.manufacturer} ${card.product}</div></div>
        <div><div class="estimate-stat__label">Card #</div><div class="estimate-stat__value">${card.card_number}${card.serial_number ? " · " + card.serial_number : ""}</div></div>
        <div><div class="estimate-stat__label">Attributes</div><div class="estimate-stat__value">${[card.rookie && "Rookie", card.autograph && "Auto", card.relic && "Relic"].filter(Boolean).join(", ") || "—"}</div></div>
      </div>
      <div class="market-read" style="margin-top:14px">Current Grail Estimate: ${card.estimate.estimate ? money(card.estimate.estimate) : "unavailable (no sales yet)"}</div>
      <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <label style="font-size:12px;color:var(--ink-soft)">Grade
          <input id="grade-input" value="${card.grade}" style="display:block;margin-top:4px;border:1px solid var(--border-strong);border-radius:6px;padding:7px 10px;font-size:13px;width:140px" />
        </label>
        <label style="font-size:12px;color:var(--ink-soft)">Acquired price
          <input id="price-input" type="number" min="0" step="1" value="0" style="display:block;margin-top:4px;border:1px solid var(--border-strong);border-radius:6px;padding:7px 10px;font-size:13px;width:140px" />
        </label>
        <label style="font-size:12px;color:var(--ink-soft)">Status
          <select id="status-input" style="display:block;margin-top:4px;border:1px solid var(--border-strong);border-radius:6px;padding:7px 10px;font-size:13px;width:140px">
            <option value="PC">PC</option>
            <option value="OPEN">OPEN</option>
            <option value="TRADE">TRADE</option>
            <option value="SELL">SELL</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>
        </label>
        <button class="action-btn" id="add-btn" style="max-width:200px">ADD TO COLLECTION</button>
      </div>
    `;
    confirmPanel.appendChild(box);
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });

    box.querySelector("#add-btn").addEventListener("click", async () => {
      const grade = box.querySelector("#grade-input").value.trim() || card.grade;
      const acquired_price = parseFloat(box.querySelector("#price-input").value) || 0;
      const status = box.querySelector("#status-input").value;
      try {
        await api.addToCollection({ card_id: card.card_id, grade, acquired_price, status });
        showToast(`Added ${card.title} to your Collection.`);
        confirmPanel.innerHTML = "";
      } catch (err) {
        showToast(`Couldn't add this card — ${err.message}`);
      }
    });
  }
}

main();
