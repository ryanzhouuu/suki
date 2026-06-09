import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapAniListListStatus,
  normalizeAniListScore,
} from "@/lib/imports/anilist-list";

describe("mapAniListListStatus", () => {
  it("maps every AniList list status to our entry status", () => {
    assert.equal(mapAniListListStatus("CURRENT"), "watching");
    assert.equal(mapAniListListStatus("COMPLETED"), "completed");
    assert.equal(mapAniListListStatus("PAUSED"), "paused");
    assert.equal(mapAniListListStatus("DROPPED"), "dropped");
    assert.equal(mapAniListListStatus("PLANNING"), "plan_to_watch");
  });

  it("treats REPEATING as watching", () => {
    assert.equal(mapAniListListStatus("REPEATING"), "watching");
  });

  it("returns null for unknown statuses", () => {
    assert.equal(mapAniListListStatus("BOGUS"), null);
  });
});

describe("normalizeAniListScore", () => {
  it("treats 0 as no score regardless of format", () => {
    assert.equal(normalizeAniListScore(0, "POINT_100"), null);
    assert.equal(normalizeAniListScore(0, "POINT_5"), null);
  });

  it("rescales POINT_100 onto 0-10", () => {
    assert.equal(normalizeAniListScore(85, "POINT_100"), 8.5);
  });

  it("passes through POINT_10 and POINT_10_DECIMAL", () => {
    assert.equal(normalizeAniListScore(8, "POINT_10"), 8);
    assert.equal(normalizeAniListScore(7.5, "POINT_10_DECIMAL"), 7.5);
  });

  it("doubles POINT_5", () => {
    assert.equal(normalizeAniListScore(4, "POINT_5"), 8);
  });

  it("maps the POINT_3 smiley scale onto 0-10", () => {
    assert.equal(normalizeAniListScore(1, "POINT_3"), 3.33);
    assert.equal(normalizeAniListScore(2, "POINT_3"), 6.67);
    assert.equal(normalizeAniListScore(3, "POINT_3"), 10);
  });

  it("rounds to two decimal places", () => {
    assert.equal(normalizeAniListScore(83, "POINT_100"), 8.3);
    assert.equal(normalizeAniListScore(77, "POINT_100"), 7.7);
  });

  it("clamps to the 0-10 range", () => {
    assert.equal(normalizeAniListScore(120, "POINT_100"), 10);
  });
});
