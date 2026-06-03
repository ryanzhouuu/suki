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
});

describe("serializeRequestPrefs", () => {
  it("sorts genres for stable serialization", () => {
    const serialized = serializeRequestPrefs({
      genres: ["Romance", "Action"],
      lengthBucket: "short",
      format: "TV",
    });
    assert.deepEqual(serialized.genres, ["Action", "Romance"]);
    assert.equal(serialized.lengthBucket, "short");
    assert.equal(serialized.format, "TV");
  });
});
