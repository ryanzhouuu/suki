import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Tables } from "@/types/database";
import {
  TIERS,
  groupRankingsIntoTiers,
  tierForScore,
} from "@/lib/ranking/tiers";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

function row(
  partial: Partial<RankedSeriesRow> & { rank: number; score: number },
): RankedSeriesRow {
  return {
    algorithm_version: "elo_series_v1",
    confidence: "high",
    series_id: `series-${partial.rank}`,
    user_id: "user-1",
    series: null,
    ...partial,
  } as RankedSeriesRow;
}

describe("tierForScore", () => {
  it("places scores at each band floor in the right tier", () => {
    assert.equal(tierForScore(1750), "S");
    assert.equal(tierForScore(1600), "A");
    assert.equal(tierForScore(1450), "B");
    assert.equal(tierForScore(1300), "C");
    assert.equal(tierForScore(1299), "D");
  });

  it("is exclusive at the upper boundary of each band", () => {
    assert.equal(tierForScore(1749), "A");
    assert.equal(tierForScore(1599), "B");
    assert.equal(tierForScore(1449), "C");
  });

  it("treats the 1500 baseline as B", () => {
    assert.equal(tierForScore(1500), "B");
  });
});

describe("groupRankingsIntoTiers", () => {
  it("returns all five tiers in S→D order even when empty", () => {
    const groups = groupRankingsIntoTiers([]);
    assert.deepEqual(
      groups.map((g) => g.tier),
      [...TIERS],
    );
    assert.ok(groups.every((g) => g.rows.length === 0));
  });

  it("buckets rows by score into the matching tier", () => {
    const groups = groupRankingsIntoTiers([
      row({ rank: 1, score: 1800 }),
      row({ rank: 2, score: 1650 }),
      row({ rank: 3, score: 1500 }),
      row({ rank: 4, score: 1200 }),
    ]);
    const byTier = Object.fromEntries(groups.map((g) => [g.tier, g.rows]));
    assert.equal(byTier.S.length, 1);
    assert.equal(byTier.A.length, 1);
    assert.equal(byTier.B.length, 1);
    assert.equal(byTier.C.length, 0);
    assert.equal(byTier.D.length, 1);
  });

  it("preserves ascending rank order within a tier", () => {
    const groups = groupRankingsIntoTiers([
      row({ rank: 3, score: 1620 }),
      row({ rank: 1, score: 1700 }),
      row({ rank: 2, score: 1650 }),
    ]);
    const a = groups.find((g) => g.tier === "A")!;
    assert.deepEqual(
      a.rows.map((r) => r.rank),
      [1, 2, 3],
    );
  });
});
