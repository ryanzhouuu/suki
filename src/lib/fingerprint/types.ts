import type { AnimeEntryStatus } from "@/lib/constants";
import type { SeriesRef } from "@/lib/library/group";

export const FINGERPRINT_VERSION = "fingerprint_v1" as const;

export const FINGERPRINT_TRAIT_IDS = [
  "genre-devotee",
  "theme-magnet",
  "eclectic-explorer",
  "focused-specialist",
  "deep-cut-devotee",
  "certified-crowd-pleaser",
  "short-form-loyalist",
  "long-haul-legend",
  "movie-night-regular",
  "completion-machine",
  "serial-sampler",
  "rewatch-ritualist",
  "reserved-applause",
  "heart-on-sleeve-rater",
  "battle-tested-favorites",
] as const;

export type FingerprintTraitId = (typeof FINGERPRINT_TRAIT_IDS)[number];

export type FingerprintState = "ready" | "forming" | "unavailable";
export type FormingReason = "ranking" | "library";

export type TraitFamily =
  | "content"
  | "breadth"
  | "discovery"
  | "format"
  | "behavior"
  | "rating"
  | "ranking";

export type TraitEvidence = {
  kind: string;
  text: string;
  value?: number;
  denominator?: number;
  seriesIds?: string[];
};

export type FingerprintTrait = {
  id: FingerprintTraitId;
  family: TraitFamily;
  label: string;
  summary: string;
  strength: number;
  evidence: TraitEvidence[];
};

export type TasteFingerprint = {
  version: typeof FINGERPRINT_VERSION;
  inputHash: string;
  state: FingerprintState;
  sourceSeriesCount: number;
  traits: FingerprintTrait[];
  /** Present only when the fingerprint is forming; null keeps the view model simple. */
  formingReason: FormingReason | null;
};

/** The minimum anime shape the pure engine needs from a route library entry. */
export type FingerprintAnime = {
  id: string;
  romaji_title: string;
  english_title: string | null;
  native_title: string | null;
  format: string | null;
  episodes: number | null;
  genres: string[];
  popularity: number | null;
  tags: unknown;
};

/** Structurally accepts the route's LibraryEntry shape without importing app code. */
export type FingerprintEntry = {
  id: string;
  anime_id: string;
  status: AnimeEntryStatus;
  rewatch_count: number;
  personal_score: number | null;
  anime: FingerprintAnime;
};

/** Structurally accepts ProfileRanking, while allowing small pure-test fixtures. */
export type FingerprintRanking = {
  series_id: string;
  rank: number;
  score: number;
  confidence: "low" | "medium" | "high";
  comparison_count: number;
  uncertainty: number | null;
  algorithm_version: string;
  series?: SeriesRef | null;
};

export type FingerprintBuildInput = {
  entries: readonly FingerprintEntry[];
  rankings: readonly FingerprintRanking[];
  seriesByAnimeId: ReadonlyMap<string, SeriesRef>;
  /** Route code can pass this after a mapping read fails to preserve unavailable. */
  mappingStatus?: "available" | "unavailable";
};
