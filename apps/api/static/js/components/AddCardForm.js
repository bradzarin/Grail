import { api } from "../api.js";
import { showToast } from "../toast.js";
import { GRADE_TABS, SPORTS } from "../grades.js";

const FIELD = "display:block;margin-top:4px;border:1px solid var(--border-strong);border-radius:6px;padding:7px 10px;font-size:13px;width:100%";

function field(label, inputHtml, spanFull) {
  return `<label style="font-size:12px;color:var(--ink-soft)${spanFull ? ";grid-column:1/-1" : ""}">${label}${inputHtml}</label>`;
}

// The real answer to "search any card back to the 1950s": there's no free bulk
// card-checklist database to wire in (same gap as live market data — see
// docs/ARCHITECTURE.md section E). Instead of faking coverage, a human who
// actually knows the card enters its real identity — same pattern as Add Comp
// for a real sale. It becomes a first-class, fully searchable CARD_MASTER
// immediately (POST /api/cards), and from its own page can be added to the
// Collection with a real grade (CardPanel.js's Add to Collection form).
export function AddCardForm(prefillPlayer) {
  const root = document.createElement("div");
  root.className = "widget-card";
  root.style.marginBottom = "24px";

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "filter-pill";
  toggleBtn.textContent = "+ Add a New Card";

  const head = document.createElement("div");
  head.className = "widget-card__head";
  head.style.marginBottom = "0";
  head.innerHTML = `<h3>Can't find it? Add it — any card, any sport, any era</h3>`;
  head.appendChild(toggleBtn);
  root.appendChild(head);

  const form = document.createElement("div");
  form.hidden = true;
  form.style.marginTop = "16px";
  root.appendChild(form);

  toggleBtn.addEventListener("click", () => {
    form.hidden = !form.hidden;
    toggleBtn.classList.toggle("active", !form.hidden);
    if (!form.hidden && !form.dataset.built) {
      buildForm();
      form.dataset.built = "1";
    }
  });

  function buildForm() {
    form.innerHTML = `
      <div class="comp-form__grid">
        ${field("Player *", `<input id="nc-player" value="${prefillPlayer || ""}" style="${FIELD}" />`)}
        ${field("Sport *", `<select id="nc-sport" style="${FIELD}">${SPORTS.map((s) => `<option value="${s}">${s}</option>`).join("")}</select>`)}
        ${field("Year *", `<input id="nc-year" placeholder="e.g. 1986 or 1993-94" style="${FIELD}" />`)}
        ${field("Team", `<input id="nc-team" style="${FIELD}" />`)}
        ${field("Manufacturer *", `<input id="nc-manufacturer" placeholder="Topps, Panini, Fleer…" style="${FIELD}" />`)}
        ${field("Product / Brand *", `<input id="nc-product" placeholder="Chrome, Prizm, Ultra…" style="${FIELD}" />`)}
        ${field("Set *", `<input id="nc-set" placeholder="Base, Kaboom!, Scoring Kings…" style="${FIELD}" />`)}
        ${field("Card #", `<input id="nc-number" style="${FIELD}" />`)}
        ${field("Parallel", `<input id="nc-parallel" placeholder="Refractor, Gold, Silver…" style="${FIELD}" />`)}
        ${field("Serial # (e.g. /99)", `<input id="nc-serial" style="${FIELD}" />`)}
        ${field("Print run (number)", `<input id="nc-printrun" type="number" min="1" style="${FIELD}" />`)}
        ${field("Grade *", `<select id="nc-grade" style="${FIELD}">${GRADE_TABS.map((g) => `<option value="${g}">${g}</option>`).join("")}</select>`)}
      </div>
      <div style="margin-top:10px;display:flex;gap:16px;font-size:12px;color:var(--ink-soft)">
        <label><input type="checkbox" id="nc-rookie" /> Rookie</label>
        <label><input type="checkbox" id="nc-auto" /> Autograph</label>
        <label><input type="checkbox" id="nc-relic" /> Relic</label>
      </div>
      <div class="market-read" style="margin-top:10px">
        This creates a real card in the catalog from what you enter — it starts with
        no sales history (honest, not guessed) and gets a Grail Estimate as soon as
        one exists, same as every other card.
      </div>
      <div style="margin-top:12px;display:flex;gap:10px">
        <button class="action-btn" id="nc-submit" style="max-width:180px">Create Card</button>
        <button class="action-btn action-btn--secondary" id="nc-cancel" style="max-width:120px">Cancel</button>
      </div>
    `;
    form.querySelector("#nc-cancel").addEventListener("click", () => {
      form.hidden = true;
      toggleBtn.classList.remove("active");
    });
    form.querySelector("#nc-submit").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const val = (id) => form.querySelector(id).value.trim();
      const player = val("#nc-player");
      const year = val("#nc-year");
      const manufacturer = val("#nc-manufacturer");
      const product = val("#nc-product");
      const setName = val("#nc-set");
      if (!player || !year || !manufacturer || !product || !setName) {
        showToast("Player, Sport, Year, Manufacturer, Product and Set are required.");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Creating…";
      try {
        const card = await api.createCard({
          player,
          sport: form.querySelector("#nc-sport").value,
          year,
          manufacturer,
          product,
          set_name: setName,
          card_number: val("#nc-number") || "—",
          parallel: val("#nc-parallel") || null,
          serial_number: val("#nc-serial") || null,
          print_run: form.querySelector("#nc-printrun").value ? parseInt(form.querySelector("#nc-printrun").value, 10) : null,
          team: val("#nc-team") || null,
          grade: form.querySelector("#nc-grade").value,
          rookie: form.querySelector("#nc-rookie").checked,
          autograph: form.querySelector("#nc-auto").checked,
          relic: form.querySelector("#nc-relic").checked,
        });
        showToast(`Created ${card.title}.`);
        location.href = `/card.html?id=${encodeURIComponent(card.card_id)}`;
      } catch (err) {
        showToast(`Couldn't create this card — ${err.message}`);
        btn.disabled = false;
        btn.textContent = "Create Card";
      }
    });
  }

  return root;
}
