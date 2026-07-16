import { TokenBucket } from "@/lib/anilist/rate-limiter";
import { env } from "@/lib/env";
import { getAnilistToken } from "@/lib/anilist/token";

/** Unauthenticated AniList limit is ~30 requests/minute. */
const RATE_LIMIT_MAX_RETRIES = 6;

/**
 * Client-side pacing: stay well under AniList's 90 req/min ceiling (often
 * degraded lower). A burst up to the capacity proceeds immediately; beyond that,
 * requests are paced. This tames self-inflicted bursts (imports, the
 * up-to-64-call franchise traversal) before they hit the server-side limit.
 */
const REQUESTS_PER_MINUTE = 60;
const BURST_CAPACITY = 20;
const limiter = new TokenBucket(BURST_CAPACITY, REQUESTS_PER_MINUTE / 60_000);

// Coalesce identical in-flight queries into one request: N concurrent views of
// the same new anime issue a single fetch. Complements the cross-request Data
// Cache, which does not dedupe concurrent misses.
const inflightRequests = new Map<string, Promise<unknown>>();

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; status?: number }>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Opt-in, process-local response cache. Disabled by default so the long-lived
// server never serves stale data; one-off scripts enable it to avoid re-fetching
// the same media (e.g. an overlapping franchise crawl) hundreds of times.
let queryCache: Map<string, unknown> | null = null;

export function enableAnilistQueryCache(): void {
  queryCache ??= new Map();
}

export function clearAnilistQueryCache(): void {
  queryCache?.clear();
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }
  // 2s, 4s, 8s, … capped at 60s
  return Math.min(60_000, 2000 * 2 ** attempt);
}

async function executeQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { cache?: RequestCache; revalidate?: number },
): Promise<T> {
  const token = getAnilistToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < RATE_LIMIT_MAX_RETRIES; attempt++) {
    // Pace outbound requests. reserve() never blocks; it returns the wait.
    const waitMs = limiter.reserve();
    if (waitMs > 0) await sleep(waitMs);

    const response = await fetch(env.anilistGraphqlUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      cache: options?.cache ?? "default",
      next:
        options?.revalidate !== undefined
          ? { revalidate: options.revalidate }
          : undefined,
    });

    if (response.status === 429) {
      const waitMs = retryDelayMs(response, attempt);
      if (attempt < RATE_LIMIT_MAX_RETRIES - 1) {
        await sleep(waitMs);
        continue;
      }
      lastError = new Error(
        "AniList rate limit exceeded (429). Wait a minute and try again.",
      );
      break;
    }

    if (!response.ok) {
      throw new Error(`AniList request failed: ${response.status}`);
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors?.length) {
      const rateLimited = json.errors.some(
        (e) =>
          e.status === 429 ||
          /rate.?limit/i.test(e.message) ||
          /too many/i.test(e.message),
      );
      if (rateLimited && attempt < RATE_LIMIT_MAX_RETRIES - 1) {
        await sleep(retryDelayMs(response, attempt));
        continue;
      }
      throw new Error(json.errors.map((e) => e.message).join(", "));
    }

    if (!json.data) {
      throw new Error("AniList returned no data");
    }

    return json.data;
  }

  throw lastError ?? new Error("AniList request failed");
}

export async function anilistQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { cache?: RequestCache; revalidate?: number },
): Promise<T> {
  const key = `${query}::${JSON.stringify(variables ?? {})}`;

  if (queryCache?.has(key)) {
    return queryCache.get(key) as T;
  }

  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = executeQuery<T>(query, variables, options)
    .then((data) => {
      if (queryCache) queryCache.set(key, data);
      return data;
    })
    .finally(() => inflightRequests.delete(key));

  inflightRequests.set(key, promise);
  return promise as Promise<T>;
}
