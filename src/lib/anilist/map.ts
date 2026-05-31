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
    popularity: media.popularity,
    source: media.source,
    metadata_updated_at: new Date().toISOString(),
  };
}
