// The real grading companies collectors actually use — not just PSA. Shared by
// the Market Trend grade tabs, Add Comp, Add to Collection, and Add a New Card,
// so "choose raw, PSA, Beckett, or other grade category" means the same list
// everywhere instead of each form inventing its own subset.
export const GRADE_TABS = [
  "Raw",
  "PSA 10", "PSA 9", "PSA 8", "PSA 7", "PSA 6", "PSA 5", "PSA <5",
  "BGS 10", "BGS 9.5", "BGS 9", "BGS 8.5", "BGS <8.5",
  "SGC 10", "SGC 9.5", "SGC 9", "SGC <9",
  "CGC 10", "CGC 9.5", "CGC 9", "CGC <9",
  "Other",
];

export const SPORTS = ["Basketball", "Baseball", "Soccer", "Football", "Hockey", "Golf", "Racing", "Wrestling", "Other"];
