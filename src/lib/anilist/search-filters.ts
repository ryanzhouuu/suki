/**
 * Extra AniList search facets beyond genre: media format and result ordering.
 * Kept as small allow-lists so the API route can validate untrusted params.
 */

/** AniList MediaFormat values worth surfacing for anime search. */
export const ANILIST_FORMATS = [
  "TV",
  "TV_SHORT",
  "MOVIE",
  "OVA",
  "ONA",
  "SPECIAL",
  "MUSIC",
] as const;

export type AniListFormat = (typeof ANILIST_FORMATS)[number];

export const ANILIST_FORMAT_LABELS: Record<AniListFormat, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  OVA: "OVA",
  ONA: "ONA",
  SPECIAL: "Special",
  MUSIC: "Music",
};

const FORMAT_SET = new Set<string>(ANILIST_FORMATS);

export function isValidAniListFormat(value: string): value is AniListFormat {
  return FORMAT_SET.has(value);
}

/**
 * Search ordering options. `relevance` maps to AniList SEARCH_MATCH when a text
 * query is present (otherwise popularity); the rest map to explicit MediaSort.
 */
export const SEARCH_SORT_KEYS = [
  "relevance",
  "popularity",
  "score",
  "trending",
  "newest",
  "oldest",
] as const;

export type SearchSortKey = (typeof SEARCH_SORT_KEYS)[number];

export const SEARCH_SORT_LABELS: Record<SearchSortKey, string> = {
  relevance: "Relevance",
  popularity: "Most popular",
  score: "Highest rated",
  trending: "Trending",
  newest: "Newest",
  oldest: "Oldest",
};

const SORT_SET = new Set<string>(SEARCH_SORT_KEYS);

export function isValidSearchSort(value: string): value is SearchSortKey {
  return SORT_SET.has(value);
}

/**
 * Translate a UI sort key into AniList MediaSort values. `relevance` depends on
 * whether the user typed a query: SEARCH_MATCH only ranks meaningfully then.
 */
export function anilistSortForSearch(
  sort: SearchSortKey,
  hasQuery: boolean,
): string[] {
  switch (sort) {
    case "popularity":
      return ["POPULARITY_DESC"];
    case "score":
      return ["SCORE_DESC"];
    case "trending":
      return ["TRENDING_DESC"];
    case "newest":
      return ["START_DATE_DESC"];
    case "oldest":
      return ["START_DATE"];
    case "relevance":
    default:
      return hasQuery ? ["SEARCH_MATCH"] : ["POPULARITY_DESC"];
  }
}
