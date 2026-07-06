/**
 * Thrown only when AniList genuinely reports no such media (`Media: null`).
 *
 * Callers use this to distinguish a real "not found" (→ 404) from a transient
 * failure (429/5xx/network/DB), which must stay a retryable error rather than
 * collapsing into a permanent 404.
 */
export class AnimeNotFoundError extends Error {
  readonly anilistId: number;

  constructor(anilistId: number) {
    super(`Anime ${anilistId} not found on AniList`);
    this.name = "AnimeNotFoundError";
    this.anilistId = anilistId;
  }
}

export function isAnimeNotFoundError(error: unknown): error is AnimeNotFoundError {
  return error instanceof AnimeNotFoundError;
}
