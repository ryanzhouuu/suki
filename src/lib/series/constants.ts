/**
 * Relation types used to connect franchise entries into one series. Deliberately
 * excludes the loose bridges OTHER and ALTERNATIVE, which carry crossovers and
 * festival specials (e.g. One Piece ↔ Dragon Ball) and let the crawl drift into
 * unrelated franchises. Title-gating in the crawl guards the remaining types.
 */
export const FRANCHISE_RELATION_TYPES: ReadonlySet<string> = new Set([
  "PREQUEL",
  "SEQUEL",
  "SIDE_STORY",
  "SPIN_OFF",
  "SUMMARY",
  "PARENT",
  "COMPILATION",
  "CONTAINS",
]);

export const SERIES_GRAPH_MAX_DEPTH = 4;
export const SERIES_GRAPH_MAX_NODES = 64;
