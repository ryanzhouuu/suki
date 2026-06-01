/** Canonical AniList anime genres (see AniList GenreCollection). */
export const ANILIST_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Hentai",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
] as const;

export type AniListGenre = (typeof ANILIST_GENRES)[number];

const GENRE_SET = new Set<string>(ANILIST_GENRES);

export function isValidAniListGenre(value: string): value is AniListGenre {
  return GENRE_SET.has(value);
}

/** Dedupe and keep only valid AniList genre strings, preserving first-seen order. */
export function normalizeGenreParams(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const trimmed = raw.trim();
    if (!trimmed || !isValidAniListGenre(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** Max genres per search request (each may trigger a separate AniList call). */
export const MAX_SEARCH_GENRES = 4;
