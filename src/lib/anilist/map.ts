import type { TablesInsert } from "@/types/database";

import { getAniListDisplayTitle, stripHtml } from "./display";
import type { AniListMediaDetail } from "./types";

export function mapAniListMediaToAnimeRow(
  media: AniListMediaDetail,
): TablesInsert<"anime"> {
  return {
    anilist_id: media.id,
    romaji_title: media.title.romaji ?? getAniListDisplayTitle(media.title),
    english_title: media.title.english,
    native_title: media.title.native,
    description: stripHtml(media.description),
    cover_image_url: media.coverImage?.large ?? null,
    banner_image_url: media.bannerImage ?? null,
    format: media.format,
    episodes: media.episodes,
    duration_minutes: media.duration,
    season: media.season,
    season_year: media.seasonYear,
    status: media.status,
    genres: media.genres ?? [],
    average_score: media.averageScore,
    mean_score: media.meanScore ?? null,
    popularity: media.popularity,
    trending: media.trending ?? null,
    favourites: media.favourites ?? null,
    source: media.source,
    country_of_origin: media.countryOfOrigin ?? null,
    hashtag: media.hashtag ?? null,
    site_url: media.siteUrl ?? null,
    start_date: media.startDate ?? null,
    end_date: media.endDate ?? null,
    trailer: media.trailer ?? null,
    studios: media.studios ?? null,
    tags: media.tags ?? null,
    rankings: media.rankings ?? null,
    external_links: media.externalLinks ?? null,
    metadata_updated_at: new Date().toISOString(),
  };
}
