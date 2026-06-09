import type { AniListMediaDetail } from "@/lib/anilist/types";
import type { AnimeEntryStatus } from "@/lib/constants";

export type ImportSource = "anilist" | "mal_xml" | "plain_text";

export type ImportMatchState = "matched" | "needs_review" | "unmatched";

/** A lightweight match candidate surfaced in the review UI. */
export type ImportCandidate = {
  anilistId: number;
  title: string;
  coverImageUrl: string | null;
  similarity?: number;
};

/**
 * A single parsed-and-matched row, staged in the import job for review and
 * commit. `media` holds the full AniList detail when known so anime rows can be
 * built offline (no per-title fetch at commit time).
 */
export type StagedRow = {
  /** Stable id within the job, used to apply user corrections. */
  rowId: string;
  sourceTitle: string;
  matchState: ImportMatchState;
  anilistId: number | null;
  media: AniListMediaDetail | null;
  status: AnimeEntryStatus;
  personalScore: number | null;
  progressEpisodes: number;
  similarity?: number;
  candidates?: ImportCandidate[];
  skip: boolean;
};

/** Per-row correction submitted from the review UI. */
export type StagedRowCorrection = {
  rowId: string;
  skip?: boolean;
  status?: AnimeEntryStatus;
  /** A newly chosen match (from a candidate or manual search). */
  anilistId?: number | null;
  personalScore?: number | null;
};

/** A resolved row ready to write as a library entry. */
export type ImportEntryInput = {
  anilistId: number;
  status: AnimeEntryStatus;
  personalScore: number | null;
  progressEpisodes: number;
};

/** Raw, pre-match source payload stored on the job until parsing completes. */
export type ImportSourceInput =
  | { kind: "anilist"; username: string }
  | { kind: "mal_xml"; entries: MalEntryInput[] }
  | { kind: "plain_text"; lines: string[] };

/** Serializable MAL entry persisted in the job's source_input. */
export type MalEntryInput = {
  malId: number;
  title: string;
  rawStatus: string;
  score: number;
  watchedEpisodes: number;
};

/** Compact progress shape returned to the client chunk loop. */
export type ImportJobProgress = {
  id: string;
  source: ImportSource;
  status: ImportJobStatus;
  total: number;
  processed: number;
  matched: number;
  needsReview: number;
  unmatched: number;
  imported: number;
  skipped: number;
  error: string | null;
};

export type ImportJobStatus =
  | "pending"
  | "parsing"
  | "needs_review"
  | "importing"
  | "series_backfill"
  | "done"
  | "failed"
  | "canceled";
