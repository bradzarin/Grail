// Per-browser demo Wants list. A real build persists this server-side against
// the user's account (docs/ARCHITECTURE.md, Milestone 3 — Wants/Trade Box).
const KEY = "grail_wants_v1";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable (private mode, etc.) — Wants just won't persist
  }
}

export function isWanted(cardId) {
  return read().includes(cardId);
}

export function toggleWant(cardId) {
  const ids = read();
  const idx = ids.indexOf(cardId);
  if (idx === -1) {
    ids.push(cardId);
  } else {
    ids.splice(idx, 1);
  }
  write(ids);
  return ids.includes(cardId);
}

export function listWantedIds() {
  return read();
}
