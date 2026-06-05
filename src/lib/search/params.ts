import {
  isValidAniListGenre,
  MAX_SEARCH_GENRES,
  normalizeGenreParams,
} from "@/lib/anilist/genres";
import {
  isValidAniListFormat,
  isValidSearchSort,
  type AniListFormat,
  type SearchSortKey,
} from "@/lib/anilist/search-filters";

export type ParsedSearchParams = {
  query: string;
  genres: string[];
  format: AniListFormat | null;
  sort: SearchSortKey;
  invalidGenre: string | null;
};

export function parseSearchParams(
  searchParams: URLSearchParams,
): ParsedSearchParams {
  const query = searchParams.get("q") ?? "";
  const rawGenres = searchParams.getAll("genre");

  const invalid = rawGenres.find(
    (g) => g.trim() && !isValidAniListGenre(g.trim()),
  );

  const rawFormat = searchParams.get("format")?.trim() ?? "";
  const rawSort = searchParams.get("sort")?.trim() ?? "";

  return {
    query,
    genres: normalizeGenreParams(rawGenres).slice(0, MAX_SEARCH_GENRES),
    format: isValidAniListFormat(rawFormat) ? rawFormat : null,
    sort: isValidSearchSort(rawSort) ? rawSort : "relevance",
    invalidGenre: invalid?.trim() ?? null,
  };
}
