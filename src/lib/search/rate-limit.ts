const SEARCH_RATE_LIMIT_PER_MINUTE = 30;
const SEARCH_RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_TRACKER_MAX_KEYS = 2_000;

type SearchRateLimitBucket = {
  count: number;
  windowStartMs: number;
};

const buckets = new Map<string, SearchRateLimitBucket>();

function evictOldBuckets(nowMs: number) {
  if (buckets.size <= RATE_LIMIT_TRACKER_MAX_KEYS) return;
  for (const [key, bucket] of buckets.entries()) {
    if (nowMs - bucket.windowStartMs >= SEARCH_RATE_LIMIT_WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

export function checkSearchRateLimit(
  key: string,
  nowMs = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  evictOldBuckets(nowMs);

  const existing = buckets.get(key);
  if (!existing || nowMs - existing.windowStartMs >= SEARCH_RATE_LIMIT_WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartMs: nowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= SEARCH_RATE_LIMIT_PER_MINUTE) {
    const elapsed = nowMs - existing.windowStartMs;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((SEARCH_RATE_LIMIT_WINDOW_MS - elapsed) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetSearchRateLimitForTests() {
  buckets.clear();
}
