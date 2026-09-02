export function LoadingState(message = "Loading…") {
  const div = document.createElement("div");
  div.className = "state-block";
  div.innerHTML = `<div class="spinner"></div>${message}`;
  return div;
}

export function ErrorState(message, onRetry) {
  const div = document.createElement("div");
  div.className = "state-block state-block--error";
  div.textContent = message;
  if (onRetry) {
    const btn = document.createElement("button");
    btn.textContent = "Retry";
    btn.className = "filter-pill";
    btn.style.marginTop = "12px";
    btn.style.display = "block";
    btn.style.marginLeft = "auto";
    btn.style.marginRight = "auto";
    btn.addEventListener("click", onRetry);
    div.appendChild(document.createElement("br"));
    div.appendChild(btn);
  }
  return div;
}

export function EmptyState(message) {
  const div = document.createElement("div");
  div.className = "state-block";
  div.textContent = message;
  return div;
}

export async function withState(container, loadFn, renderFn, emptyCheckFn, emptyMessage) {
  container.innerHTML = "";
  container.appendChild(LoadingState());
  try {
    const data = await loadFn();
    container.innerHTML = "";
    if (emptyCheckFn && emptyCheckFn(data)) {
      container.appendChild(EmptyState(emptyMessage || "Nothing here yet."));
      return data;
    }
    renderFn(data, container);
    return data;
  } catch (err) {
    container.innerHTML = "";
    container.appendChild(
      ErrorState(`Couldn't load this — ${err.message}`, () =>
        withState(container, loadFn, renderFn, emptyCheckFn, emptyMessage)
      )
    );
    return null;
  }
}
