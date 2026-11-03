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

/** When the next episode airs, as a credit line: `Tonight · 10:30 PM`, `Wed · 9:00 AM`, `Nov 14`. */
export type AiringCredit = {
  day: string;
  time: string | null;
  /** Airing today (or already out): the day reads in the accent color. */
  soon: boolean;
};

const EVENING_HOUR = 17;
const DAY_MS = 24 * 60 * 60 * 1000;

function zonedParts(date: Date, timeZone: string | undefined) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    dayStamp: Date.UTC(get("year"), get("month") - 1, get("day")),
    hour: get("hour"),
  };
}

function validTimeZone(timeZone: string | null | undefined): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

function formatInZone(
  date: Date,
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone })
    .format(date)
    .replace(/\s/g, " ");
}

/**
 * Credit-line airing time in the viewer's timezone. Today reads "Tonight" from
 * 5 PM ("Today" before), the next six days by weekday, anything later by date.
 */
export function formatAiringCredit(
  airingAt: number,
  nowMs: number,
  timeZone?: string | null,
): AiringCredit {
  if (airingAt * 1000 <= nowMs) return { day: "Out now", time: null, soon: true };

  const zone = validTimeZone(timeZone);
  const airDate = new Date(airingAt * 1000);
  const air = zonedParts(airDate, zone);
  const now = zonedParts(new Date(nowMs), zone);
  const dayDiff = Math.round((air.dayStamp - now.dayStamp) / DAY_MS);
  const time = formatInZone(airDate, zone, { hour: "numeric", minute: "2-digit" });

  if (dayDiff <= 0) {
    return { day: air.hour >= EVENING_HOUR ? "Tonight" : "Today", time, soon: true };
  }
  if (dayDiff < 7) {
    return { day: formatInZone(airDate, zone, { weekday: "short" }), time, soon: false };
  }
  return {
    day: formatInZone(airDate, zone, { month: "short", day: "numeric" }),
    time: null,
    soon: false,
  };
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
