import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MOOD_PRESETS,
  blendEmbeddings,
  moodBlendWeight,
  resolveMoodSeedText,
} from "@/lib/recommendations/mood";

describe("resolveMoodSeedText", () => {
  it("maps a preset key to its descriptive seed text", () => {
    assert.equal(resolveMoodSeedText("cozy"), MOOD_PRESETS.cozy.seedText);
  });

  it("uses free text as-is", () => {
    assert.equal(
      resolveMoodSeedText("a slow burn that wrecks me"),
      "a slow burn that wrecks me",
    );
  });
});

describe("moodBlendWeight", () => {
  it("increases with adventurousness", () => {
    assert.ok(moodBlendWeight("safe") < moodBlendWeight("balanced"));
    assert.ok(moodBlendWeight("balanced") < moodBlendWeight("adventurous"));
  });
});

describe("blendEmbeddings", () => {
  it("returns a unit-length vector", () => {
    const taste = [3, 0, 0];
    const mood = [0, 4, 0];
    const blended = blendEmbeddings(taste, mood, 0.5);
    const norm = Math.sqrt(blended.reduce((acc, v) => acc + v * v, 0));
    assert.ok(Math.abs(norm - 1) < 1e-9);
  });

  it("leans toward the mood vector as weight grows", () => {
    const taste = [1, 0];
    const mood = [0, 1];
    const low = blendEmbeddings(taste, mood, 0.2);
    const high = blendEmbeddings(taste, mood, 0.8);
    // index 1 is the mood axis; higher weight => larger mood component
    assert.ok(high[1] > low[1]);
  });

  it("throws on dimension mismatch", () => {
    assert.throws(() => blendEmbeddings([1, 2], [1], 0.5));
  });
});
