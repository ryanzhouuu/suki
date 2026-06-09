import type {
  AniListMediaDetail,
  AniListScoreFormat,
} from "@/lib/anilist/types";
import type { AnimeEntryStatus } from "@/lib/constants";

export type { AniListScoreFormat };

/** A single entry from a user's MediaListCollection. */
export type AniListListEntry = {
  status: string;
  score: number;
  progress: number;
  media: AniListMediaDetail;
};

const LIST_STATUS_MAP: Record<string, AnimeEntryStatus> = {
  CURRENT: "watching",
  REPEATING: "watching",
  COMPLETED: "completed",
  PAUSED: "paused",
  DROPPED: "dropped",
  PLANNING: "plan_to_watch",
};

/** Map an AniList MediaListStatus to our entry status. */
export function mapAniListListStatus(status: string): AnimeEntryStatus | null {
  return LIST_STATUS_MAP[status] ?? null;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Normalize an AniList list score onto personal_score (0-10, 2dp).
 * A score of 0 means the user left it unrated → null.
 */
export function normalizeAniListScore(
  score: number,
  format: AniListScoreFormat,
): number | null {
  if (!Number.isFinite(score) || score <= 0) return null;

  let value: number;
  switch (format) {
    case "POINT_100":
      value = score / 10;
      break;
    case "POINT_5":
      value = score * 2;
      break;
    case "POINT_3":
      value = (score / 3) * 10;
      break;
    case "POINT_10":
    case "POINT_10_DECIMAL":
    default:
      value = score;
      break;
  }

  return roundTo2(Math.min(10, Math.max(0, value)));
}
