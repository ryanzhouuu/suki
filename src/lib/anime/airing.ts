import type { AniListAiringMedia } from "@/lib/anilist/types";
import type { LibraryEntry } from "@/lib/library/queries";

/** A watching entry that is still airing, ready for display. */
export type AiringRow = {
  entryId: string;
  anilistId: number;
  title: string;
  coverUrl: string | null;
  nextEpisodeNumber: number;
  /** Unix seconds (absolute) when the next episode airs. */
  airingAt: number;
  episodesBehind: number;
  progressEpisodes: number;
  totalEpisodes: number | null;
};

/**
 * Join watching entries to their AniList airing media and produce display rows,
 * soonest-airing first. Entries with no scheduled next episode (finished or on
 * hiatus) are excluded — the feature keys off next-episode timing.
 */
export function buildAiringRows(
  entries: LibraryEntry[],
  mediaById: Map<number, AniListAiringMedia>,
): AiringRow[] {
  const rows: AiringRow[] = [];

  for (const entry of entries) {
    const media = mediaById.get(entry.anime.anilist_id);
    const next = media?.nextAiringEpisode;
    if (!media || !next) continue;

    const latestAired = next.episode - 1;
    const episodesBehind = Math.max(0, latestAired - entry.progress_episodes);
    const title =
      entry.anime.english_title ||
      entry.anime.romaji_title ||
      entry.anime.native_title ||
      "Unknown";

    rows.push({
      entryId: entry.id,
      anilistId: entry.anime.anilist_id,
      title,
      coverUrl: entry.anime.cover_image_url,
      nextEpisodeNumber: next.episode,
      airingAt: next.airingAt,
      episodesBehind,
      progressEpisodes: entry.progress_episodes,
      totalEpisodes: media.episodes ?? entry.anime.episodes,
    });
  }

  rows.sort((a, b) => a.airingAt - b.airingAt);
  return rows;
}

/** Format seconds-until-airing as a compact countdown, e.g. "2d 4h", "5h 12m", "8m". */
export function formatTimeUntil(secondsUntil: number): string {
  if (secondsUntil <= 0) return "now";
  const totalMinutes = Math.floor(secondsUntil / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
