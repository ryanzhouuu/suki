import "server-only";

/**
 * TMDB v3 API key (`TMDB_API_KEY`). Server-only: backdrop lookups need it, and
 * the resulting image URLs do not.
 */
export function getTmdbApiKey(): string | null {
  const key = process.env.TMDB_API_KEY?.trim();
  return key ? key : null;
}
