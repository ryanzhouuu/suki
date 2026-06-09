import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { titleSimilarity } from "@/lib/imports/similarity";

describe("titleSimilarity", () => {
  it("returns 1 for identical titles", () => {
    assert.equal(titleSimilarity("Attack on Titan", "Attack on Titan"), 1);
  });

  it("is case-insensitive and ignores surrounding whitespace", () => {
    assert.equal(titleSimilarity("  COWBOY bebop ", "Cowboy Bebop"), 1);
  });

  it("ignores punctuation differences", () => {
    assert.equal(
      titleSimilarity("Re:Zero kara Hajimeru", "ReZero kara Hajimeru"),
      1,
    );
  });

  it("scores completely unrelated titles well below the auto-accept bar", () => {
    assert.ok(titleSimilarity("Naruto", "Clannad") < 0.3);
  });

  it("scores a close-but-different title below the 0.85 auto-accept bar", () => {
    // Season variants should not clear the high-confidence threshold.
    const score = titleSimilarity(
      "Fullmetal Alchemist",
      "Fullmetal Alchemist: Brotherhood",
    );
    assert.ok(score < 0.85, `expected < 0.85, got ${score}`);
  });

  it("scores a near-exact match above 0.85", () => {
    const score = titleSimilarity(
      "Demon Slayer Kimetsu no Yaiba",
      "Demon Slayer: Kimetsu no Yaiba",
    );
    assert.ok(score >= 0.85, `expected >= 0.85, got ${score}`);
  });

  it("handles empty strings without throwing", () => {
    assert.equal(titleSimilarity("", ""), 1);
    assert.equal(titleSimilarity("Naruto", ""), 0);
  });
});
