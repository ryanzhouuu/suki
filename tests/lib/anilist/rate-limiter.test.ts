import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TokenBucket } from "@/lib/anilist/rate-limiter";

describe("TokenBucket", () => {
  it("lets a burst up to capacity through with no wait", () => {
    const now = 1000;
    const bucket = new TokenBucket(3, 1 / 1000, () => now);
    assert.equal(bucket.reserve(), 0);
    assert.equal(bucket.reserve(), 0);
    assert.equal(bucket.reserve(), 0);
  });

  it("paces requests beyond the burst capacity", () => {
    const now = 0;
    // capacity 2, refill 1 token / 1000ms
    const bucket = new TokenBucket(2, 1 / 1000, () => now);
    assert.equal(bucket.reserve(), 0); // token 1
    assert.equal(bucket.reserve(), 0); // token 2 (bucket now empty)
    assert.equal(bucket.reserve(), 1000); // must wait one refill interval
    assert.equal(bucket.reserve(), 2000); // and the next waits two
  });

  it("refills over elapsed time", () => {
    let now = 0;
    const bucket = new TokenBucket(1, 1 / 1000, () => now);
    assert.equal(bucket.reserve(), 0); // consume the only token
    assert.equal(bucket.reserve(), 1000); // empty → wait
    now = 3000; // 3s later, plenty refilled (capped at capacity)
    assert.equal(bucket.reserve(), 0);
  });
});
