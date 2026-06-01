import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ResolvedComparison } from "./preference-graph";
import {
  hasOneHopBridge,
  shouldSkipComparisonByRankDistance,
  type RankContext,
} from "./prompt-skip";

const comparisons: ResolvedComparison[] = [
  { winnerId: "new", loserId: "ten" },
  { winnerId: "ten", loserId: "one" },
];

const ctx: RankContext = {
  rankBySeriesId: new Map([
    ["new", 3],
    ["ten", 10],
    ["one", 12],
  ]),
  comparisonCountBySeriesId: new Map([
    ["new", 1],
    ["ten", 5],
    ["one", 4],
  ]),
};

describe("shouldSkipComparisonByRankDistance", () => {
  it("skips far-apart pairs by rank gap alone", () => {
    assert.equal(
      shouldSkipComparisonByRankDistance("new", "one", comparisons, ctx),
      true,
    );
  });

  it("does not use long transitive chains without sufficient gap", () => {
    const tight: RankContext = {
      rankBySeriesId: new Map([
        ["new", 4],
        ["ten", 5],
        ["one", 6],
      ]),
      comparisonCountBySeriesId: new Map([
        ["new", 2],
        ["ten", 5],
        ["one", 4],
      ]),
    };
    assert.equal(
      shouldSkipComparisonByRankDistance("new", "one", comparisons, tight),
      false,
    );
  });

  it("skips with one-hop bridge when gap meets bridge minimum", () => {
    const bridgeCtx: RankContext = {
      rankBySeriesId: new Map([
        ["new", 4],
        ["ten", 6],
        ["one", 8],
      ]),
      comparisonCountBySeriesId: new Map([
        ["new", 2],
        ["ten", 5],
        ["one", 4],
      ]),
    };
    assert.equal(
      shouldSkipComparisonByRankDistance("new", "one", comparisons, bridgeCtx),
      true,
    );
  });

  it("skips via bridge when the higher-ranked id is on the right", () => {
    const bridgeCtx: RankContext = {
      rankBySeriesId: new Map([
        ["one", 4],
        ["ten", 6],
        ["new", 8],
      ]),
      comparisonCountBySeriesId: new Map([
        ["one", 2],
        ["ten", 5],
        ["new", 2],
      ]),
    };
    const reversed: ResolvedComparison[] = [
      { winnerId: "one", loserId: "ten" },
      { winnerId: "ten", loserId: "new" },
    ];
    assert.equal(
      shouldSkipComparisonByRankDistance("one", "new", reversed, bridgeCtx),
      true,
    );
  });
});

describe("hasOneHopBridge", () => {
  it("requires the intermediate to sit between ranks", () => {
    assert.equal(hasOneHopBridge(comparisons, "new", "one", ctx.rankBySeriesId), true);
    assert.equal(
      hasOneHopBridge(comparisons, "new", "one", new Map([
        ["new", 3],
        ["ten", 2],
        ["one", 12],
      ])),
      false,
    );
  });
});
