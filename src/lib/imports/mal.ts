import type { AnimeEntryStatus } from "@/lib/constants";

/** A raw entry parsed from a MyAnimeList XML export. */
export type MalEntry = {
  malId: number;
  title: string;
  rawStatus: string;
  /** MAL score 0-10 as exported (0 means "no score"). */
  score: number;
  watchedEpisodes: number;
};

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function tagValue(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeEntities(match[1]) : null;
}

/** Parse a MAL XML export into raw entries (one per `<anime>` node). */
export function parseMalXml(xml: string): MalEntry[] {
  const entries: MalEntry[] = [];
  const blocks = xml.matchAll(/<anime>([\s\S]*?)<\/anime>/g);

  for (const [, block] of blocks) {
    const malId = Number.parseInt(tagValue(block, "series_animedb_id") ?? "", 10);
    const title = tagValue(block, "series_title") ?? "";
    const rawStatus = tagValue(block, "my_status") ?? "";
    const score = Number.parseInt(tagValue(block, "my_score") ?? "0", 10);
    const watchedEpisodes = Number.parseInt(
      tagValue(block, "my_watched_episodes") ?? "0",
      10,
    );

    if (!Number.isFinite(malId)) continue;

    entries.push({
      malId,
      title,
      rawStatus,
      score: Number.isFinite(score) ? score : 0,
      watchedEpisodes: Number.isFinite(watchedEpisodes) ? watchedEpisodes : 0,
    });
  }

  return entries;
}

const MAL_STATUS_MAP: Record<string, AnimeEntryStatus> = {
  watching: "watching",
  "1": "watching",
  completed: "completed",
  "2": "completed",
  "on-hold": "paused",
  "3": "paused",
  dropped: "dropped",
  "4": "dropped",
  "plan to watch": "plan_to_watch",
  "6": "plan_to_watch",
};

/** Map a MAL status (string label or numeric code) to our entry status. */
export function mapMalStatus(rawStatus: string): AnimeEntryStatus | null {
  return MAL_STATUS_MAP[rawStatus.trim().toLowerCase()] ?? null;
}

/** Normalize a MAL 0-10 score onto personal_score (0 → null, clamped 1-10). */
export function normalizeMalScore(score: number): number | null {
  if (!Number.isFinite(score) || score <= 0) return null;
  return Math.min(10, score);
}
