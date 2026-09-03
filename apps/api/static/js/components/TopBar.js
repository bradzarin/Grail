import { icon } from "../icons.js";

export function TopBar() {
  const bar = document.createElement("div");
  bar.className = "topbar";

  const searchWrap = document.createElement("div");
  searchWrap.className = "search-wrap";
  searchWrap.innerHTML = `${icon("search", 16)}<input type="search" class="search-input" placeholder="Search players, cards, sets..." />`;
  const input = searchWrap.querySelector("input");
  const params = new URLSearchParams(location.search);
  if (params.get("q")) input.value = params.get("q");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      location.href = `/market.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });
  bar.appendChild(searchWrap);

  const icons = document.createElement("div");
  icons.className = "topbar__icons";
  icons.innerHTML = `
    <a class="icon-btn" href="/alerts.html" title="Alerts">${icon("bell", 17)}<span class="icon-btn__badge">2</span></a>
    <a class="icon-btn" href="/wants.html" title="Wants">${icon("mail", 17)}</a>
    <button class="icon-btn" title="Menu">${icon("menu", 17)}</button>
  `;
  bar.appendChild(icons);

  return bar;
}
