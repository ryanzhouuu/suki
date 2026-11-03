import "server-only";

import {
  fetchTmdbBackdrop,
  indexAnilistTmdb,
  preferTmdbBackdrops,
  type AnilistTmdbRecord,
  type TmdbTarget,
} from "@/lib/tmdb/artwork";
import { getTmdbApiKey } from "@/lib/tmdb/key";

const MAP_URL =
  "https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-full.json";
const MAP_TIMEOUT_MS = 5000;
const BACKDROP_TIMEOUT_MS = 1500;

let indexPromise: Promise<Map<number, TmdbTarget>> | null = null;

/** Resolves with `fallback` when `promise` is still pending after `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

/** Process-wide AniList → TMDB index. The file is too large for the Next data cache, so it lives in memory and a failed load can be retried. */
function loadAnilistTmdbIndex(): Promise<Map<number, TmdbTarget>> {
  if (!indexPromise) {
    indexPromise = fetch(MAP_URL, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`AniList TMDB map failed (${response.status})`);
        const records = (await response.json()) as AnilistTmdbRecord[];
        if (!Array.isArray(records)) throw new Error("AniList TMDB map was not a list");
        return indexAnilistTmdb(records);
      })
      .catch((error: unknown) => {
        indexPromise = null;
        throw error;
      });
  }
  return indexPromise;
}

/**
 * Hero artwork for the given shows. TMDB backdrops replace AniList banners
 * when the map and the API both have one. Anything else keeps `bannerUrl`.
 */
export async function withTmdbHeroArtwork<T extends { anilistId: number; bannerUrl: string | null }>(
  items: T[],
): Promise<T[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey || items.length === 0) return items;

  const index = await withTimeout(loadAnilistTmdbIndex(), MAP_TIMEOUT_MS, null);
  if (!index) return items;

  return preferTmdbBackdrops(items, (anilistId) => {
    const target = index.get(anilistId);
    if (!target) return Promise.resolve(null);
    return withTimeout(fetchTmdbBackdrop(target, apiKey), BACKDROP_TIMEOUT_MS, null);
  });
}
