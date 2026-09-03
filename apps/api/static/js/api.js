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
  createCard: (body) =>
    request("/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  getTrend: (id, grade) => request(`/cards/${encodeURIComponent(id)}/trend${grade ? `?grade=${encodeURIComponent(grade)}` : ""}`),
  getCollection: () => request("/collection"),
  getCollectionSummary: () => request("/collection/summary"),
  getCollectionPerformance: () => request("/collection/performance"),
  getCollectionBreakdown: (by) => request(`/collection/breakdown?by=${encodeURIComponent(by)}`),
  getDiscover: () => request("/discover"),
  getMarket: () => request("/market"),
  searchChecklist: (q) => request(`/checklist/search?q=${encodeURIComponent(q)}`),
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
  uploadInstancePhoto: (instanceId, side, file) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/collection/${encodeURIComponent(instanceId)}/photo?side=${side}`, {
      method: "POST",
      body: form,
    });
  },
  deleteInstancePhoto: (instanceId, side) =>
    request(`/collection/${encodeURIComponent(instanceId)}/photo?side=${side}`, { method: "DELETE" }),
};
