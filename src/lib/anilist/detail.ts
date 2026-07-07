import { anilistQuery } from "@/lib/anilist/client";
import { cachedAnilistFetch } from "@/lib/anilist/cache";
import { ANIME_DETAIL_QUERY } from "@/lib/anilist/queries";
import type { AniListMediaResult } from "@/lib/anilist/types";
import { AnimeNotFoundError } from "@/lib/anime/errors";

/**
 * Uncached detail fetch. The cache layer (`cachedAnilistFetch`) owns caching, so
 * the inner request is `no-store`; `forceRefresh` call sites use this directly to
 * bypass the Data Cache entirely.
 */
export function fetchAnimeDetailUncached(
  anilistId: number,
): Promise<AniListMediaResult> {
  return anilistQuery<AniListMediaResult>(
    ANIME_DETAIL_QUERY,
    { id: anilistId },
    { cache: "no-store" },
  );
}

async function fetchCacheableAnimeDetail(
  anilistId: number,
): Promise<AniListMediaResult> {
  const result = await fetchAnimeDetailUncached(anilistId);

  if (!result.Media) {
    throw new AnimeNotFoundError(anilistId);
  }

  return result;
}

/**
 * Shared, cross-request-cached detail fetch for a single AniList id.
 *
 * Wrapped **once** here (30-min default TTL) so all three call sites
 * (`get-for-display`, `sync`, `catalog-sync`) share one cache entry per id
 * instead of each maintaining its own — this is where the call-volume win comes
 * from. The catalog row remains the durable copy, so a short TTL is fine.
 */
export const fetchAnimeDetail = cachedAnilistFetch(
  ["anilist-detail"],
  fetchCacheableAnimeDetail,
  { tags: ["anilist-detail"] },
);
