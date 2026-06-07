import type { AniListFormat, SearchSortKey } from "@/lib/anilist/search-filters";
import type { AniListMediaSummary } from "@/lib/anilist/types";

const SEARCH_CACHE_TTL_MS = 60_000;
const SEARCH_CACHE_MAX_ENTRIES = 300;

type SearchCacheEntry = {
  media: AniListMediaSummary[];
  expiresAt: number;
};

const searchCache = new Map<string, SearchCacheEntry>();
const inflightByKey = new Map<string, Promise<AniListMediaSummary[]>>();

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function normalizeGenres(genres: string[]): string[] {
  return genres
    .map((genre) => genre.trim().toLowerCase())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function touchEntry(key: string, entry: SearchCacheEntry) {
  searchCache.delete(key);
  searchCache.set(key, entry);
}

function evictExpired(now: number) {
  for (const [key, entry] of searchCache.entries()) {
    if (entry.expiresAt <= now) {
      searchCache.delete(key);
    }
  }
}

function evictOverflow() {
  while (searchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (!oldestKey) break;
    searchCache.delete(oldestKey);
  }
}

export function buildSearchCacheKey(input: {
  query: string;
  genres: string[];
  format?: AniListFormat | null;
  sort?: SearchSortKey | null;
}): string {
  return JSON.stringify({
    q: normalizeQuery(input.query),
    genres: normalizeGenres(input.genres),
    format: input.format ?? "",
    sort: input.sort ?? "relevance",
  });
}

export async function getCachedSearch(
  input: {
    query: string;
    genres: string[];
    format?: AniListFormat | null;
    sort?: SearchSortKey | null;
  },
  load: () => Promise<AniListMediaSummary[]>,
  now = Date.now(),
): Promise<{ media: AniListMediaSummary[]; cacheHit: boolean }> {
  evictExpired(now);

  const key = buildSearchCacheKey(input);
  const cached = searchCache.get(key);
  if (cached && cached.expiresAt > now) {
    touchEntry(key, cached);
    return { media: cached.media, cacheHit: true };
  }

  if (cached) {
    searchCache.delete(key);
  }

  const inflight = inflightByKey.get(key);
  if (inflight) {
    return { media: await inflight, cacheHit: true };
  }

  const pending = load()
    .then((media) => {
      const entry: SearchCacheEntry = {
        media,
        expiresAt: now + SEARCH_CACHE_TTL_MS,
      };
      touchEntry(key, entry);
      evictOverflow();
      return media;
    })
    .finally(() => {
      inflightByKey.delete(key);
    });

  inflightByKey.set(key, pending);
  return { media: await pending, cacheHit: false };
}

export function resetSearchCacheForTests() {
  searchCache.clear();
  inflightByKey.clear();
}
