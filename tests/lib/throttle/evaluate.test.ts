import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { evaluateActionThrottle } from "@/lib/throttle/evaluate";

const MIN = 60_000;

describe("evaluateActionThrottle", () => {
  it("allows with no history", () => {
    assert.deepEqual(
      evaluateActionThrottle({ recentTimestampsMs: [], nowMs: 0, cooldownMs: MIN, dailyLimit: 5 }),
      { allowed: true },
    );
  });
  it("blocks inside the cooldown window", () => {
    const d = evaluateActionThrottle({
      recentTimestampsMs: [100_000], nowMs: 130_000, cooldownMs: MIN, dailyLimit: 5,
    });
    assert.deepEqual(d, { allowed: false, retryAfterSeconds: 30 });
  });
  it("allows once the cooldown elapses", () => {
    const d = evaluateActionThrottle({
      recentTimestampsMs: [100_000], nowMs: 161_000, cooldownMs: MIN, dailyLimit: 5,
    });
    assert.deepEqual(d, { allowed: true });
  });
  it("blocks at the daily limit until the oldest entry ages out", () => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const stamps = [1 * MIN, 2 * MIN, 3 * MIN];
    const d = evaluateActionThrottle({
      recentTimestampsMs: stamps, nowMs: 10 * MIN, cooldownMs: MIN, dailyLimit: 3,
    });
    // Oldest entry (1 min) exits the 24h window at nowMs - DAY_MS boundary:
    // retryAfter = (oldest - (now - DAY_MS)) / 1000 = (60_000 - (600_000 - DAY_MS)) / 1000
    assert.deepEqual(d, {
      allowed: false,
      retryAfterSeconds: Math.ceil((1 * MIN - (10 * MIN - DAY_MS)) / 1000),
    });
  });
  it("ignores entries older than 24h", () => {
    const now = 25 * 60 * 60 * 1000;
    const d = evaluateActionThrottle({
      recentTimestampsMs: [1_000], nowMs: now, cooldownMs: MIN, dailyLimit: 1,
    });
    assert.deepEqual(d, { allowed: true });
  });
});
