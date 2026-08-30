import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRunInputHash } from "@/lib/recommendations/run-input-hash";
import type { RecommendationRequestPrefs } from "@/lib/recommendations/request-prefs";

const prefs: RecommendationRequestPrefs = {
  genres: ["Drama", "Action"],
  lengthBucket: "short",
  format: "TV",
  mood: "cozy",
  adventurousness: "balanced",
};

describe("buildRunInputHash", () => {
  it("is stable across equivalent genre ordering", () => {
    const first = buildRunInputHash("taste-hash", prefs);
    const reordered = buildRunInputHash("taste-hash", {
      ...prefs,
      genres: ["Action", "Drama"],
    });

    assert.equal(first, reordered);
  });

  it("changes with taste data or request preferences", () => {
    const base = buildRunInputHash("taste-hash", prefs);

    assert.notEqual(buildRunInputHash("new-taste-hash", prefs), base);
    assert.notEqual(
      buildRunInputHash("taste-hash", { ...prefs, mood: "intense" }),
      base,
    );
  });
});
