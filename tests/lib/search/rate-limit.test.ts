import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkSearchRateLimit,
  resetSearchRateLimitForTests,
} from "@/lib/search/rate-limit";

describe("checkSearchRateLimit", () => {
  it("allows requests up to the per-minute limit then blocks", () => {
    resetSearchRateLimitForTests();
    const key = "127.0.0.1:/api/search";
    const now = 10_000;

    let blockedAt = -1;
    for (let i = 1; i <= 31; i += 1) {
      const result = checkSearchRateLimit(key, now);
      if (!result.allowed) {
        blockedAt = i;
        assert.ok(result.retryAfterSeconds > 0);
        break;
      }
    }

    assert.equal(blockedAt, 31);
  });

  it("resets the bucket after the window elapses", () => {
    resetSearchRateLimitForTests();
    const key = "127.0.0.1:/api/search";
    const base = 20_000;

    for (let i = 0; i < 30; i += 1) {
      assert.equal(checkSearchRateLimit(key, base).allowed, true);
    }
    assert.equal(checkSearchRateLimit(key, base).allowed, false);

    const afterWindow = base + 60_001;
    assert.equal(checkSearchRateLimit(key, afterWindow).allowed, true);
  });
});
