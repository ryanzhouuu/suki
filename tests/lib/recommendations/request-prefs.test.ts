import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_REQUEST_PREFS,
  isEmptyRequestPrefs,
  parseRecommendationRequestPrefs,
  serializeRequestPrefs,
} from "@/lib/recommendations/request-prefs";

describe("parseRecommendationRequestPrefs", () => {
  it("parses empty form as empty prefs", () => {
    const form = new FormData();
    const result = parseRecommendationRequestPrefs(form);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.prefs, EMPTY_REQUEST_PREFS);
    assert.ok(isEmptyRequestPrefs(result.prefs));
  });

  it("parses genres, length, and format", () => {
    const form = new FormData();
    form.append("genre", "Action");
    form.append("genre", "Comedy");
    form.append("lengthBucket", "movie");
    form.append("format", "MOVIE");

    const result = parseRecommendationRequestPrefs(form);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.prefs.genres, ["Action", "Comedy"]);
    assert.equal(result.prefs.lengthBucket, "movie");
    assert.equal(result.prefs.format, "MOVIE");
  });

  it("rejects invalid length bucket", () => {
    const form = new FormData();
    form.append("lengthBucket", "epic");
    const result = parseRecommendationRequestPrefs(form);
    assert.equal(result.ok, false);
  });

  it("resolves a valid mood preset and adventurousness level", () => {
    const form = new FormData();
    form.append("moodPreset", "cozy");
    form.append("adventurousness", "adventurous");
    const result = parseRecommendationRequestPrefs(form);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.prefs.mood, "cozy");
    assert.equal(result.prefs.adventurousness, "adventurous");
  });

  it("lets free text override a selected preset", () => {
    const form = new FormData();
    form.append("moodPreset", "cozy");
    form.append("moodText", "  something that'll wreck me  ");
    const result = parseRecommendationRequestPrefs(form);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.prefs.mood, "something that'll wreck me");
  });

  it("ignores unknown presets and invalid adventurousness", () => {
    const form = new FormData();
    form.append("moodPreset", "not-a-mood");
    form.append("adventurousness", "reckless");
    const result = parseRecommendationRequestPrefs(form);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.prefs.mood, null);
    assert.equal(result.prefs.adventurousness, "balanced");
  });
});

describe("serializeRequestPrefs", () => {
  it("sorts genres and includes mood + adventurousness", () => {
    const serialized = serializeRequestPrefs({
      genres: ["Romance", "Action"],
      lengthBucket: "short",
      format: "TV",
      mood: "cozy",
      adventurousness: "safe",
    });
    assert.deepEqual(serialized.genres, ["Action", "Romance"]);
    assert.equal(serialized.lengthBucket, "short");
    assert.equal(serialized.format, "TV");
    assert.equal(serialized.mood, "cozy");
    assert.equal(serialized.adventurousness, "safe");
  });
});
