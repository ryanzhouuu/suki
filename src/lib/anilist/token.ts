import "server-only";

/**
 * Optional AniList OAuth access token (`ANILIST_TOKEN`).
 *
 * Public metadata (titles, schedules, relations — all this app reads) needs no
 * auth; a token only buys a higher authenticated rate ceiling. It is a secret
 * and must never reach the client bundle, so it is read only through this
 * `server-only` accessor rather than a bare `process.env` read in a module that
 * could be imported client-side.
 *
 * Returns `null` when unset, so `anilistQuery` behaves exactly as before.
 */
export function getAnilistToken(): string | null {
  const token = process.env.ANILIST_TOKEN?.trim();
  return token ? token : null;
}
