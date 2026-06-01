import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ELO_INITIAL_SCORE } from "@/lib/constants";

import {
  applyComparison,
  confidenceFromComparisonCount,
  expectedScore,
  updateElo,
} from "./elo";

describe("expectedScore", () => {
  it("returns 0.5 for equal ratings", () => {
    assert.equal(expectedScore(1500, 1500), 0.5);
  });

  it("favors higher-rated player", () => {
    assert.ok(expectedScore(1600, 1400) > 0.5);
  });
});

describe("updateElo", () => {
  it("increases winner and decreases loser", () => {
    const { winner, loser } = updateElo(1500, 1500);
    assert.ok(winner > 1500);
    assert.ok(loser < 1500);
  });
});

describe("confidenceFromComparisonCount", () => {
  it("maps comparison counts to bands", () => {
    assert.equal(confidenceFromComparisonCount(0), "low");
    assert.equal(confidenceFromComparisonCount(3), "medium");
    assert.equal(confidenceFromComparisonCount(8), "high");
  });
});

describe("applyComparison", () => {
  it("initializes and updates entity scores", () => {
    const scores = new Map();
    applyComparison(scores, "a", "b");

    const a = scores.get("a")!;
    const b = scores.get("b")!;
    assert.equal(a.comparisonCount, 1);
    assert.equal(b.comparisonCount, 1);
    assert.ok(a.score > ELO_INITIAL_SCORE);
    assert.ok(b.score < ELO_INITIAL_SCORE);
  });
});
