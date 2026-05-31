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

/** Currently airing, sorted by newest start date. */
export async function getLatestAnime(): Promise<DiscoverAnimeItem[]> {
  return fetchDiscover(["START_DATE_DESC"], "RELEASING");
}

/** All-time popularity on AniList. */
export async function getPopularAnime(): Promise<DiscoverAnimeItem[]> {
  return fetchDiscover(["POPULARITY_DESC"]);
}
