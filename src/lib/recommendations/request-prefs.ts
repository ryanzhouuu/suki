import { normalizeGenreParams } from "@/lib/anilist/genres";

import { MOOD_PRESET_KEYS } from "./mood";

/** Length buckets for next-watch requests. */
export const LENGTH_BUCKETS = ["movie", "short", "cour", "long"] as const;
export type LengthBucket = (typeof LENGTH_BUCKETS)[number];

const LENGTH_BUCKET_SET = new Set<string>(LENGTH_BUCKETS);

/** Common AniList format values stored on `anime.format`. */
export const ANIME_FORMATS = [
  "TV",
  "TV_SHORT",
  "MOVIE",
  "OVA",
  "ONA",
  "SPECIAL",
  "MUSIC",
] as const;
export type AnimeFormat = (typeof ANIME_FORMATS)[number];

const FORMAT_SET = new Set<string>(ANIME_FORMATS);

/** Steers how surprising the results are: blend weight + sampler variance. */
export const ADVENTUROUSNESS_LEVELS = [
  "safe",
  "balanced",
  "adventurous",
] as const;
export type AdventurousnessLevel = (typeof ADVENTUROUSNESS_LEVELS)[number];

const ADVENTUROUSNESS_SET = new Set<string>(ADVENTUROUSNESS_LEVELS);

/** Max length accepted for a free-text mood; keeps the embed call cheap. */
const MOOD_TEXT_MAX_LENGTH = 200;

export type RecommendationRequestPrefs = {
  genres: string[];
  lengthBucket: LengthBucket | null;
  format: AnimeFormat | null;
  /** Preset key or raw free text; null when no mood is requested. */
  mood: string | null;
  adventurousness: AdventurousnessLevel;
};

export const EMPTY_REQUEST_PREFS: RecommendationRequestPrefs = {
  genres: [],
  lengthBucket: null,
  format: null,
  mood: null,
  adventurousness: "balanced",
};

export function isEmptyRequestPrefs(prefs: RecommendationRequestPrefs): boolean {
  return (
    prefs.genres.length === 0 &&
    prefs.lengthBucket === null &&
    prefs.format === null
  );
}

/** Stable JSON for hashing and run metadata. */
export function serializeRequestPrefs(
  prefs: RecommendationRequestPrefs,
): Record<string, string | string[] | null> {
  return {
    genres: [...prefs.genres].sort(),
    lengthBucket: prefs.lengthBucket,
    format: prefs.format,
    mood: prefs.mood,
    adventurousness: prefs.adventurousness,
  };
}

export type ParseRequestPrefsResult =
  | { ok: true; prefs: RecommendationRequestPrefs }
  | { ok: false; error: string };

export function parseRecommendationRequestPrefs(
  formData: FormData,
): ParseRequestPrefsResult {
  const genres = normalizeGenreParams(formData.getAll("genre").map(String));

  const rawLength = String(formData.get("lengthBucket") ?? "").trim();
  let lengthBucket: LengthBucket | null = null;
  if (rawLength) {
    if (!LENGTH_BUCKET_SET.has(rawLength)) {
      return { ok: false, error: "Invalid length selection." };
    }
    lengthBucket = rawLength as LengthBucket;
  }

  const rawFormat = String(formData.get("format") ?? "").trim();
  let format: AnimeFormat | null = null;
  if (rawFormat) {
    if (!FORMAT_SET.has(rawFormat)) {
      return { ok: false, error: "Invalid format selection." };
    }
    format = rawFormat as AnimeFormat;
  }

  // Free text wins over a selected preset chip.
  const moodText = String(formData.get("moodText") ?? "")
    .trim()
    .slice(0, MOOD_TEXT_MAX_LENGTH);
  const moodPreset = String(formData.get("moodPreset") ?? "").trim();
  let mood: string | null = null;
  if (moodText) {
    mood = moodText;
  } else if (moodPreset && MOOD_PRESET_KEYS.has(moodPreset)) {
    mood = moodPreset;
  }

  const rawAdventurousness = String(
    formData.get("adventurousness") ?? "balanced",
  ).trim();
  const adventurousness: AdventurousnessLevel = ADVENTUROUSNESS_SET.has(
    rawAdventurousness,
  )
    ? (rawAdventurousness as AdventurousnessLevel)
    : "balanced";

  return {
    ok: true,
    prefs: { genres, lengthBucket, format, mood, adventurousness },
  };
}
