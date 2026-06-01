const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/** Unauthenticated AniList limit is ~30 requests/minute. */
const RATE_LIMIT_MAX_RETRIES = 6;

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; status?: number }>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function anilistQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { cache?: RequestCache; revalidate?: number },
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < RATE_LIMIT_MAX_RETRIES; attempt++) {
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
