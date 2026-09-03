const BASE = "/api";

async function request(path, options) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) {
    let detail = null;
    try {
      detail = (await res.json())?.detail;
    } catch {
      // body wasn't JSON — fall through to the generic message
    }
    throw new Error(detail || `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listCards: () => request("/cards"),
  getCard: (id) => request(`/cards/${encodeURIComponent(id)}`),
  getTrend: (id, grade) => request(`/cards/${encodeURIComponent(id)}/trend${grade ? `?grade=${encodeURIComponent(grade)}` : ""}`),
  getCollection: () => request("/collection"),
  getCollectionSummary: () => request("/collection/summary"),
  getCollectionPerformance: () => request("/collection/performance"),
  getCollectionBreakdown: (by) => request(`/collection/breakdown?by=${encodeURIComponent(by)}`),
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
  getCompSources: () => request("/comp-sources"),
  addComp: (cardId, body) =>
    request(`/cards/${encodeURIComponent(cardId)}/comps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
