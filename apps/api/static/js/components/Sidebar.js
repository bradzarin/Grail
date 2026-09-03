import { icon } from "../icons.js";

const LINKS = [
  ["home", "Home", "/", "home"],
  ["market", "Market", "/market.html", "market"],
  ["collection", "Collection", "/collection.html", "collection"],
  ["trade", "Trade", "/trade.html", "trade"],
  ["scan", "Scan + Add", "/scan.html", "scan"],
  ["wants", "Wants", "/wants.html", "heart"],
  ["alerts", "Alerts", "/alerts.html", "alerts"],
  ["profile", "Profile", "/profile.html", "profile"],
];

export function Sidebar(active) {
  const aside = document.createElement("aside");
  aside.className = "sidebar";

  const brand = document.createElement("a");
  brand.href = "/";
  brand.className = "sidebar__brand";
  brand.innerHTML = `<img src="/static/assets/the_grail_logo.png" alt="" onerror="this.remove()" /><span>The Grail</span>`;
  aside.appendChild(brand);

  const nav = document.createElement("nav");
  nav.className = "sidebar__nav";
  LINKS.forEach(([key, label, href, iconName]) => {
    const a = document.createElement("a");
    a.href = href;
    a.className = "sidebar__link" + (key === active ? " active" : "");
    a.innerHTML = `${icon(iconName)}<span>${label}</span>`;
    nav.appendChild(a);
  });
  aside.appendChild(nav);

  const spacer = document.createElement("div");
  spacer.style.flex = "1";
  aside.appendChild(spacer);

  const upsell = document.createElement("div");
  upsell.className = "sidebar__upsell";
  upsell.innerHTML = `
    <div class="sidebar__upsell-title">${icon("grail", 16)} THE GRAIL+</div>
    <div class="sidebar__upsell-sub">Unlock more</div>
    <ul>
      <li>Advanced analytics</li>
      <li>Price alerts</li>
      <li>Market insights</li>
    </ul>
    <button disabled title="Preview build — subscriptions aren't wired up yet">Upgrade (preview)</button>
  `;
  aside.appendChild(upsell);

  const profile = document.createElement("a");
  profile.href = "/profile.html";
  profile.className = "sidebar__profile";
  profile.innerHTML = `<div class="sidebar__avatar">B</div><div><div class="sidebar__profile-name">Brad Z.</div><div class="sidebar__profile-sub">View profile</div></div>`;
  aside.appendChild(profile);

  return aside;
}
