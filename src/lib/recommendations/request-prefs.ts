import { normalizeGenreParams } from "@/lib/anilist/genres";

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

export type RecommendationRequestPrefs = {
  genres: string[];
  lengthBucket: LengthBucket | null;
  format: AnimeFormat | null;
};

export const EMPTY_REQUEST_PREFS: RecommendationRequestPrefs = {
  genres: [],
  lengthBucket: null,
  format: null,
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

  return {
    ok: true,
    prefs: { genres, lengthBucket, format },
  };
}
