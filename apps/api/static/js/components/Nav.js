export function Nav(active) {
  const nav = document.createElement("nav");
  nav.className = "grail-nav";
  nav.innerHTML = `
    <a class="grail-nav__brand" href="/">
      <img src="/static/assets/the_grail_logo.png" alt="" onerror="this.remove()" />
      The Grail
    </a>
    <div class="grail-nav__links">
      <a href="/" data-key="collection">Collection</a>
      <a href="/card.html?id=mj-scoring-kings-5" data-key="market">Market</a>
    </div>
  `;
  nav.querySelectorAll("[data-key]").forEach((a) => {
    if (a.dataset.key === active) a.classList.add("active");
  });
  return nav;
}
