import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createSeededRandom,
  shuffleWithSeed,
} from "@/lib/recommendations/seeded-random";

describe("createSeededRandom", () => {
  it("is deterministic for the same seed", () => {
    const a = createSeededRandom("test");
    const b = createSeededRandom("test");
    assert.deepEqual(
      Array.from({ length: 5 }, () => a()),
      Array.from({ length: 5 }, () => b()),
    );
  });

  it("differs across seeds", () => {
    const a = createSeededRandom("a");
    const b = createSeededRandom("b");
    assert.notEqual(a(), b());
  });
});

describe("shuffleWithSeed", () => {
  it("permutes deterministically", () => {
    const items = [1, 2, 3, 4, 5];
    assert.deepEqual(shuffleWithSeed(items, "s1"), shuffleWithSeed([1, 2, 3, 4, 5], "s1"));
  });
});
