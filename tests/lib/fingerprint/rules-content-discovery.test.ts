import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rankedProfile } from "./fixtures";
import {
  neutralProfile,
  popularityProfile,
  qualifies,
} from "./rule-fixtures";

describe("content and discovery rule boundaries", () => {
  it("qualifies Theme Magnet at six supporting franchises", () => {
    const tag = {
      name: "Time Travel",
      isAdult: false,
      isGeneralSpoiler: false,
      isMediaSpoiler: false,
    };
    assert.equal(qualifies(rankedProfile({ count: 5, tags: [tag] }), "theme-magnet"), false);
    assert.equal(qualifies(rankedProfile({ count: 6, tags: [tag] }), "theme-magnet"), true);
    assert.equal(qualifies(rankedProfile({ count: 7, tags: [tag] }), "theme-magnet"), true);
  });

  it("qualifies Eclectic Explorer at ten broad franchises", () => {
    const profiles = [neutralProfile(9), neutralProfile(10), neutralProfile(11)];
    profiles.forEach((input) =>
      input.entries.forEach((item, index) => {
        item.anime.genres = [`genre-${index}`];
      }),
    );
    assert.equal(qualifies(profiles[0], "eclectic-explorer"), false);
    assert.equal(qualifies(profiles[1], "eclectic-explorer"), true);
    assert.equal(qualifies(profiles[2], "eclectic-explorer"), true);
  });

  it("qualifies Focused Specialist at ten concentrated franchises", () => {
    const profiles = [neutralProfile(9), neutralProfile(10), neutralProfile(11)];
    profiles.forEach((input) =>
      input.entries.forEach((item, index) => {
        item.anime.genres = [
          index < Math.ceil(input.entries.length * 0.6) ? "Action" : "Drama",
        ];
      }),
    );
    assert.equal(qualifies(profiles[0], "focused-specialist"), false);
    assert.equal(qualifies(profiles[1], "focused-specialist"), true);
    assert.equal(qualifies(profiles[2], "focused-specialist"), true);
  });

  it("requires sixty percent low-popularity support", () => {
    const below = popularityProfile([10_000, 10_000, 50_000, 50_000, 50_000]);
    const exact = popularityProfile([10_000, 10_000, 10_000, 50_000, 50_000]);
    const above = popularityProfile([10_000, 10_000, 10_000, 10_000, 50_000]);
    assert.equal(qualifies(below, "deep-cut-devotee"), false);
    assert.equal(qualifies(exact, "deep-cut-devotee"), true);
    assert.equal(qualifies(above, "deep-cut-devotee"), true);
  });

  it("requires sixty percent crowd-pleaser support", () => {
    const below = popularityProfile([100_000, 100_000, 50_000, 50_000, 50_000]);
    const exact = popularityProfile([100_000, 100_000, 100_000, 50_000, 50_000]);
    const above = popularityProfile([100_000, 100_000, 100_000, 100_000, 50_000]);
    assert.equal(qualifies(below, "certified-crowd-pleaser"), false);
    assert.equal(qualifies(exact, "certified-crowd-pleaser"), true);
    assert.equal(qualifies(above, "certified-crowd-pleaser"), true);
  });
});
