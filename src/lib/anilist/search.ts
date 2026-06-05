import { MAX_SEARCH_GENRES } from "@/lib/anilist/genres";
import {
  anilistSortForSearch,
  type AniListFormat,
  type SearchSortKey,
} from "@/lib/anilist/search-filters";

import { anilistQuery } from "./client";
import { ANIME_SEARCH_QUERY } from "./queries";
import type { AniListMediaSummary, AniListSearchResult } from "./types";

export type SearchAniListOptions = {
  genres?: string[];
  format?: AniListFormat;
  sort?: SearchSortKey;
  perPage?: number;
};

async function fetchSearchPage(
  search: string | undefined,
  genres: string[] | undefined,
  format: AniListFormat | undefined,
  sort: string[],
  perPage: number,
): Promise<AniListMediaSummary[]> {
  const data = await anilistQuery<AniListSearchResult>(
    ANIME_SEARCH_QUERY,
    {
      search: search?.trim() || undefined,
      genres: genres?.length ? genres : undefined,
      format: format ?? undefined,
      sort,
      page: 1,
      perPage,
    },
    { cache: "no-store" },
  );

  return data.Page?.media ?? [];
}

/**
 * Search AniList anime. Multiple genres use OR semantics (one API call per genre,
 * merged by id) because AniList genre_in with multiple values is AND.
 */
export async function searchAniListAnime(
  query: string,
  options?: SearchAniListOptions,
): Promise<AniListMediaSummary[]> {
  const trimmed = query.trim();
  const genres = (options?.genres ?? []).slice(0, MAX_SEARCH_GENRES);
  const format = options?.format;
  const perPage = options?.perPage ?? 20;

  if (!trimmed && genres.length === 0 && !format) {
    return [];
  }

  const sort = anilistSortForSearch(options?.sort ?? "relevance", Boolean(trimmed));
  const searchArg = trimmed || undefined;

  if (genres.length === 0) {
    return fetchSearchPage(searchArg, undefined, format, sort, perPage);
  }

  if (genres.length === 1) {
    return fetchSearchPage(searchArg, genres, format, sort, perPage);
  }

  const seen = new Set<number>();
  const merged: AniListMediaSummary[] = [];

  for (const genre of genres) {
    const batch = await fetchSearchPage(searchArg, [genre], format, sort, perPage);
    for (const media of batch) {
      if (seen.has(media.id)) continue;
      seen.add(media.id);
      merged.push(media);
    }
  }

  return merged.slice(0, perPage);
}
