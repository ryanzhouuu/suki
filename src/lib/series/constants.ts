import type { AniListRelationType } from "@/lib/anilist/types";

/** Relation types used to connect franchise entries into one series. */
export const FRANCHISE_RELATION_TYPES: ReadonlySet<string> = new Set([
  "PREQUEL",
  "SEQUEL",
  "SIDE_STORY",
  "SUMMARY",
  "OTHER",
  "PARENT",
  "COMPILATION",
  "CONTAINS",
  "ALTERNATIVE",
]);

export const SERIES_GRAPH_MAX_DEPTH = 4;
export const SERIES_GRAPH_MAX_NODES = 32;
