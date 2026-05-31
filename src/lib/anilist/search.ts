import { anilistQuery } from "./client";
import { ANIME_SEARCH_QUERY } from "./queries";
import type { AniListMediaSummary, AniListSearchResult } from "./types";

export async function searchAniListAnime(
  query: string,
  perPage = 20,
): Promise<AniListMediaSummary[]> {
  if (!query.trim()) {
    return [];
  }

  const data = await anilistQuery<AniListSearchResult>(
    ANIME_SEARCH_QUERY,
    { search: query.trim(), page: 1, perPage },
    { cache: "no-store" },
  );

  return data.Page?.media ?? [];
}
