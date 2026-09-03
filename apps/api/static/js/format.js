export function money(value) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function shortDate(iso) {
  // Dates are stored as bare YYYY-MM-DD (no time), which Date parses as UTC
  // midnight — format back out in UTC too, or a negative-offset local timezone
  // rolls the displayed day back by one. Same fix MarketTicker.js already uses
  // for its own axis labels.
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
