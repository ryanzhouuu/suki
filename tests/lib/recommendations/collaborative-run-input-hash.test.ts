import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCollaborativeRunInputHash } from "@/lib/recommendations/collaborative-run-input-hash";
import type { CollaborativeRecommendationPrefs } from "@/lib/recommendations/collaborative-types";

const prefs: CollaborativeRecommendationPrefs = {
  mode: "best_shared_match",
  genres: ["Drama"],
  format: null,
  lengthBucket: null,
};

describe("buildCollaborativeRunInputHash", () => {
  it("is stable for identical inputs", () => {
    const a = buildCollaborativeRunInputHash("viewer", "friend", "friend-id", prefs);
    const b = buildCollaborativeRunInputHash("viewer", "friend", "friend-id", prefs);
    assert.equal(a, b);
  });

  it("changes when mode or partner changes", () => {
    const base = buildCollaborativeRunInputHash("viewer", "friend", "friend-id", prefs);
    const differentMode = buildCollaborativeRunInputHash(
      "viewer",
      "friend",
      "friend-id",
      { ...prefs, mode: "surprise_us" },
    );
    const differentFriend = buildCollaborativeRunInputHash(
      "viewer",
      "friend",
      "friend-id-2",
      prefs,
    );
    assert.notEqual(base, differentMode);
    assert.notEqual(base, differentFriend);
  });
});
