// Robust image with fallback — a broken/missing src never collapses the layout.
// See HANDOFF.md section 14.
export function CardImage({ src, alt, initials }) {
  const wrap = document.createElement("div");
  wrap.className = "card-tile__media-inner";
  wrap.style.width = "100%";
  wrap.style.height = "100%";

  if (!src) {
    wrap.appendChild(fallback(initials));
    return wrap;
  }

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt || "";
  img.loading = "lazy";
  img.addEventListener(
    "error",
    () => {
      wrap.innerHTML = "";
      wrap.appendChild(fallback(initials));
    },
    { once: true }
  );
  wrap.appendChild(img);
  return wrap;
}

function fallback(initials) {
  const div = document.createElement("div");
  div.className = "card-fallback";
  div.textContent = initials || "?";
  return div;
}
