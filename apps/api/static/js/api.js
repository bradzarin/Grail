const BASE = "/api";

async function request(path, options) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listCards: () => request("/cards"),
  getCard: (id) => request(`/cards/${encodeURIComponent(id)}`),
  getTrend: (id, grade) => request(`/cards/${encodeURIComponent(id)}/trend${grade ? `?grade=${encodeURIComponent(grade)}` : ""}`),
  getCollection: () => request("/collection"),
  getCollectionSummary: () => request("/collection/summary"),
  getMarket: () => request("/market"),
  getGrails: () => request("/grails"),
  getSuggestedPickups: () => request("/suggested-pickups"),
  getTradeDemo: () => request("/trade/demo"),
  addToCollection: (body) =>
    request("/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
