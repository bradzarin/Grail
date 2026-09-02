const BASE = "/api";

async function request(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listCards: () => request("/cards"),
  getCard: (id) => request(`/cards/${encodeURIComponent(id)}`),
  getTrend: (id) => request(`/cards/${encodeURIComponent(id)}/trend`),
  getCollection: () => request("/collection"),
  getCollectionSummary: () => request("/collection/summary"),
};
