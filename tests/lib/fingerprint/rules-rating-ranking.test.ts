import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rankedProfile } from "./fixtures";
import { qualifies, scoreProfile } from "./rule-fixtures";

describe("rating and ranking rule boundaries", () => {
  it("qualifies Reserved Applause at a 6.5 mean", () => {
    const profile = (score: number) => scoreProfile(Array.from({ length: 8 }, () => score));
    assert.equal(qualifies(profile(7), "reserved-applause"), false);
    assert.equal(qualifies(profile(6.5), "reserved-applause"), true);
    assert.equal(qualifies(profile(6), "reserved-applause"), true);
  });

  it("qualifies Heart-on-Sleeve Rater at an 8.5 mean", () => {
    const profile = (score: number) => scoreProfile(Array.from({ length: 8 }, () => score));
    assert.equal(qualifies(profile(8.4), "heart-on-sleeve-rater"), false);
    assert.equal(qualifies(profile(8.5), "heart-on-sleeve-rater"), true);
    assert.equal(qualifies(profile(9), "heart-on-sleeve-rater"), true);
  });

  it("requires ten ranks with sixty percent confident support", () => {
    const profile = (count: number, confident: number) => {
      const input = rankedProfile({ count, episodes: null, score: null });
      input.entries.forEach((item) => {
        item.anime.genres = [];
      });
      input.rankings.forEach((item, index) => {
        item.confidence = index < confident ? "medium" : "low";
      });
      return input;
    };
    assert.equal(qualifies(profile(9, 9), "battle-tested-favorites"), false);
    assert.equal(qualifies(profile(10, 6), "battle-tested-favorites"), true);
    assert.equal(qualifies(profile(11, 7), "battle-tested-favorites"), true);
  });
});
