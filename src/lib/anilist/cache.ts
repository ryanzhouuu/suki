import { unstable_cache } from "next/cache";

/** Short TTL for best-effort AniList schedule caching (30 min). */
export const ANILIST_CACHE_TTL_SECONDS = 1800;

/** Shared cache tag namespace so AniList entries can be invalidated together. */
export const ANILIST_CACHE_TAG = "anilist";

/**
 * Wrap an AniList fetch function in Next's cross-request Data Cache.
 *
 * The cache key is derived from `keyParts` plus the serialized arguments passed
 * to the returned function, so callers should pass stable, order-normalized
 * arguments (e.g. a sorted id list). The wrapped function should fetch with
 * `{ cache: "no-store" }` so this layer owns caching.
 */
export function cachedAnilistFetch<A extends unknown[], T>(
  keyParts: string[],
  fn: (...args: A) => Promise<T>,
  options?: { revalidate?: number; tags?: string[] },
): (...args: A) => Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: options?.revalidate ?? ANILIST_CACHE_TTL_SECONDS,
    tags: [ANILIST_CACHE_TAG, ...(options?.tags ?? [])],
  });
}
