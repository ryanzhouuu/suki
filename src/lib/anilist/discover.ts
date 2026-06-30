import { cache } from "react";

import { anilistQuery } from "./client";
import { getAniListDisplayTitle } from "./display";
import { ANIME_DISCOVER_QUERY } from "./queries";
import type { AniListDiscoverResult, AniListMediaSummary } from "./types";

const DISCOVER_CACHE_SECONDS = 60 * 60;
const DISCOVER_PER_PAGE = 24;

export type DiscoverAnimeItem = {
  anilistId: number;
  title: string;
  coverUrl: string | null;
  format: string | null;
  seasonYear: number | null;
};

function toDiscoverItem(media: AniListMediaSummary): DiscoverAnimeItem {
  return {
    anilistId: media.id,
    title: getAniListDisplayTitle(media.title),
    coverUrl: media.coverImage?.large ?? null,
    format: media.format,
    seasonYear: media.seasonYear,
  };
}

async function fetchDiscover(
  sort: string[],
  status?: string,
): Promise<DiscoverAnimeItem[]> {
  const variables: Record<string, unknown> = {
    sort,
    page: 1,
    perPage: DISCOVER_PER_PAGE,
  };
  if (status) {
    variables.status = status;
  }

  const data = await anilistQuery<AniListDiscoverResult>(
    ANIME_DISCOVER_QUERY,
    variables,
    { revalidate: DISCOVER_CACHE_SECONDS },
  );

  return (data.Page?.media ?? []).map(toDiscoverItem);
}

const MAX_DISCOVER_PER_PAGE = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Top anime on AniList by popularity (paginated). For CLI backfills — not React-cached.
 */
export async function fetchTopPopularAnimeIds(
  limit: number,
  options?: { pageDelayMs?: number },
): Promise<number[]> {
  const perPage = Math.min(MAX_DISCOVER_PER_PAGE, limit);
  const ids: number[] = [];
  let page = 1;

  while (ids.length < limit) {
    const data = await anilistQuery<AniListDiscoverResult>(
      ANIME_DISCOVER_QUERY,
      {
        sort: ["POPULARITY_DESC"],
        page,
        perPage,
      },
      { cache: "no-store" },
    );

    const media = data.Page?.media ?? [];
    if (media.length === 0) break;

    for (const item of media) {
      if (ids.includes(item.id)) continue;
      ids.push(item.id);
      if (ids.length >= limit) break;
    }

    const lastPage = data.Page?.pageInfo?.lastPage;
    if (!lastPage || page >= lastPage) break;

    page += 1;
    if (options?.pageDelayMs) {
      await sleep(options.pageDelayMs);
    }
  }

  return ids.slice(0, limit);
}

/** Currently airing, sorted by newest start date. */
export const getLatestAnime = cache(async (): Promise<DiscoverAnimeItem[]> => {
  return fetchDiscover(["START_DATE_DESC"], "RELEASING");
});

/** All-time popularity on AniList. */
export const getPopularAnime = cache(async (): Promise<DiscoverAnimeItem[]> => {
  return fetchDiscover(["POPULARITY_DESC"]);
});

/** Currently trending on AniList. */
export const getTrendingAnime = cache(async (): Promise<DiscoverAnimeItem[]> => {
  return fetchDiscover(["TRENDING_DESC"]);
});
