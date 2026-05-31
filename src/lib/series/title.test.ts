import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { slugifySeriesTitle, stripSeasonSuffix } from "./title";

describe("stripSeasonSuffix", () => {
  it("removes season and part suffixes", () => {
    assert.equal(stripSeasonSuffix("Jujutsu Kaisen Season 2"), "Jujutsu Kaisen");
    assert.equal(
      stripSeasonSuffix("Jujutsu Kaisen Season 3: The Culling Game Part 1"),
      "Jujutsu Kaisen",
    );
    assert.equal(stripSeasonSuffix("Frieren Part 2"), "Frieren");
  });

  it("leaves base titles unchanged", () => {
    assert.equal(stripSeasonSuffix("Jujutsu Kaisen"), "Jujutsu Kaisen");
    assert.equal(stripSeasonSuffix("Jujutsu Kaisen 0"), "Jujutsu Kaisen 0");
  });
});

describe("slugifySeriesTitle", () => {
  it("includes anilist id for uniqueness", () => {
    assert.equal(
      slugifySeriesTitle("Jujutsu Kaisen", 145064),
      "jujutsu-kaisen-145064",
    );
  });
});
