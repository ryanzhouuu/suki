import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pairKey } from "@/lib/ranking/canonical-pair";
import {
  isBootstrap,
  pairProbability,
  scorePair,
  selectAnchors,
  selectNextPair,
  type SeriesStat,
} from "@/lib/ranking/active-sampling";
import { createSeededRandom } from "@/lib/recommendations/seeded-random";

function stat(
  seriesId: string,
  score: number,
  uncertainty: number,
  comparisonCount: number,
): SeriesStat {
  return { seriesId, score, uncertainty, comparisonCount };
}

// Five well-compared series spanning the score range, plus a brand-new one.
const confident: SeriesStat[] = [
  stat("a", 1700, 0.5, 10),
  stat("b", 1600, 0.5, 10),
  stat("c", 1500, 0.5, 10),
  stat("d", 1400, 0.5, 10),
  stat("e", 1300, 0.5, 10),
];

describe("pairProbability", () => {
  it("is 0.5 at equal score and favors the higher score", () => {
    assert.equal(pairProbability(1500, 1500), 0.5);
    assert.ok(pairProbability(1700, 1500) > 0.5);
  });
});

describe("scorePair", () => {
  it("peaks for a close matchup and drops for a lopsided one", () => {
    const close = scorePair(stat("x", 1500, 1, 5), stat("y", 1500, 1, 5));
    const lopsided = scorePair(stat("x", 1500, 1, 5), stat("y", 3000, 1, 5));
    assert.ok(close > lopsided);
    assert.ok(lopsided < 0.01);
  });

  it("scales with combined uncertainty", () => {
    const certain = scorePair(stat("x", 1500, 0.5, 9), stat("y", 1500, 0.5, 9));
    const uncertain = scorePair(stat("x", 1500, 8, 1), stat("y", 1500, 8, 1));
    assert.ok(uncertain > certain);
  });
});

describe("selectAnchors", () => {
  it("picks confident series spanning the score range", () => {
    const anchors = selectAnchors(confident);
    assert.equal(anchors.length, 3);
    assert.deepEqual(
      anchors.map((s) => s.seriesId),
      ["a", "c", "e"],
    );
  });

  it("excludes under-compared series", () => {
    const anchors = selectAnchors([
      ...confident,
      stat("new", 1550, 8, 1),
    ]);
    assert.ok(!anchors.some((s) => s.seriesId === "new"));
  });
});

describe("isBootstrap", () => {
  it("is true with fewer than 3 confident series", () => {
    assert.equal(isBootstrap([stat("a", 1500, 8, 1), stat("b", 1500, 8, 1)]), true);
    assert.equal(isBootstrap(confident), false);
  });
});

describe("selectNextPair", () => {
  const rng = () => 0; // deterministic: argmax-ish (weighted pick takes the top)

  it("returns null when every remaining pair is settled (stop signal)", () => {
    // All confident, closely spaced → max info gain well under the threshold.
    const pair = selectNextPair(confident, new Set(), { rng });
    assert.equal(pair, null);
  });

  it("surfaces a brand-new uncertain series against the established ranking", () => {
    const stats = [...confident, stat("new", 1550, 8, 1)];
    const pair = selectNextPair(stats, new Set(), {
      rng,
      epsilon: 0,
      topK: 1,
    });
    assert.ok(pair);
    assert.ok(pair!.includes("new"));
  });

  it("never returns an already-seen pair", () => {
    // Two close, uncertain series would be the obvious pick — but it's seen.
    const stats = [
      stat("a", 1500, 8, 1),
      stat("b", 1495, 8, 1),
      stat("c", 1200, 8, 1),
    ];
    const seen = new Set([pairKey("a", "b")]);
    const pair = selectNextPair(stats, seen, { rng, epsilon: 0, topK: 1 });
    assert.ok(pair);
    assert.notEqual(pairKey(pair![0], pair![1]), pairKey("a", "b"));
  });

  it("offers the most informative pair in bootstrap mode (thin ranking)", () => {
    // All under-compared → bootstrap (all-pairs candidates). The closest,
    // most-uncertain matchup wins.
    const stats = [
      stat("a", 1520, 8, 1),
      stat("b", 1500, 8, 1),
      stat("c", 1480, 8, 1),
    ];
    const pair = selectNextPair(stats, new Set(), { rng, epsilon: 0, topK: 1 });
    assert.ok(pair);
    assert.deepEqual([...pair!].sort(), ["a", "b"]);
  });

  it("is deterministic for a given seed", () => {
    const stats = [...confident, stat("new", 1550, 8, 1), stat("new2", 1450, 8, 1)];
    const first = selectNextPair(stats, new Set(), {
      rng: createSeededRandom("seed-1"),
    });
    const second = selectNextPair(stats, new Set(), {
      rng: createSeededRandom("seed-1"),
    });
    assert.deepEqual(first, second);
  });
});
