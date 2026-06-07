import type { AniListFormat, SearchSortKey } from "@/lib/anilist/search-filters";
import type { AniListMediaSummary } from "@/lib/anilist/types";

import { searchAniListAnime } from "@/lib/anilist/search";

import { getCachedSearch } from "./cache";
import { parseSearchParams } from "./params";
import { checkSearchRateLimit } from "./rate-limit";

const SEARCH_RESPONSE_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=120";
const SEARCH_RATE_LIMIT_ERROR = "Too many search requests. Please wait and try again.";

function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function buildSearchRateLimitKey(request: Request): string {
  const url = new URL(request.url);
  return `${clientIpFromRequest(request)}:${url.pathname}`;
}

type SearchHandlerResult = {
  status: number;
  body: { media: AniListMediaSummary[] } | { error: string };
  headers?: Record<string, string>;
};

type SearchHandlerDeps = {
  search?: (query: string, options?: {
    genres?: string[];
    format?: AniListFormat;
    sort?: SearchSortKey;
  }) => Promise<AniListMediaSummary[]>;
  nowMs?: () => number;
};

export async function handleSearchRequest(
  request: Request,
  deps: SearchHandlerDeps = {},
): Promise<SearchHandlerResult> {
  const { searchParams } = new URL(request.url);
  const { query, genres, format, sort, invalidGenre } =
    parseSearchParams(searchParams);

  if (invalidGenre) {
    return {
      status: 400,
      body: { error: `Invalid genre: ${invalidGenre}` },
    };
  }

  if (!query.trim() && genres.length === 0 && !format) {
    return {
      status: 200,
      body: { media: [] },
      headers: { "Cache-Control": SEARCH_RESPONSE_CACHE_CONTROL },
    };
  }

  const nowMs = deps.nowMs?.() ?? Date.now();
  const rateLimit = checkSearchRateLimit(buildSearchRateLimitKey(request), nowMs);
  if (!rateLimit.allowed) {
    return {
      status: 429,
      body: { error: SEARCH_RATE_LIMIT_ERROR },
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    };
  }

  const searchFn = deps.search ?? searchAniListAnime;

  try {
    const { media, cacheHit } = await getCachedSearch(
      { query, genres, format, sort },
      () =>
        searchFn(query, {
          genres,
          format: format ?? undefined,
          sort,
        }),
      nowMs,
    );

    return {
      status: 200,
      body: { media },
      headers: {
        "Cache-Control": SEARCH_RESPONSE_CACHE_CONTROL,
        "X-Search-Cache": cacheHit ? "HIT" : "MISS",
      },
    };
  } catch (error) {
    return {
      status: 502,
      body: {
        error: error instanceof Error ? error.message : "Search failed",
      },
    };
  }
}
