let el = null;
let hideTimer = null;

export function showToast(message) {
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add("visible"));
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => el.classList.remove("visible"), 2600);
}
