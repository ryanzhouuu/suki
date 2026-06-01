import {
  isValidAniListGenre,
  MAX_SEARCH_GENRES,
  normalizeGenreParams,
} from "@/lib/anilist/genres";

export type ParsedSearchParams = {
  query: string;
  genres: string[];
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

  return {
    query,
    genres: normalizeGenreParams(rawGenres).slice(0, MAX_SEARCH_GENRES),
    invalidGenre: invalid?.trim() ?? null,
  };
}
