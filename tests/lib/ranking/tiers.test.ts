import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Tables } from "@/types/database";
import {
  TIERS,
  groupRankingsIntoTiers,
  tierForZScore,
} from "@/lib/ranking/tiers";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

function row(
  partial: Partial<RankedSeriesRow> & { rank: number; score: number },
): RankedSeriesRow {
  return {
    algorithm_version: "bt_series_v1",
    confidence: "high",
    uncertainty: null,
    series_id: `series-${partial.rank}`,
    user_id: "user-1",
    series: null,
    ...partial,
  } as RankedSeriesRow;
}

describe("tierForZScore", () => {
  it("places z-scores at each band floor in the right tier", () => {
    assert.equal(tierForZScore(1.0), "S");
    assert.equal(tierForZScore(0.3), "A");
    assert.equal(tierForZScore(-0.3), "B");
    assert.equal(tierForZScore(-1.0), "C");
    assert.equal(tierForZScore(-1.01), "D");
  });

  it("treats the mean (z = 0) as B", () => {
    assert.equal(tierForZScore(0), "B");
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

  it("buckets by per-user spread, not absolute score", () => {
    // A widely-spread ranking fills the extreme tiers; the exact scores are
    // large (Bradley-Terry scale) but only their spread relative to the mean
    // matters.
    const groups = groupRankingsIntoTiers([
      row({ rank: 1, score: 3000 }),
      row({ rank: 2, score: 1800 }),
      row({ rank: 3, score: 1500 }),
      row({ rank: 4, score: 1200 }),
      row({ rank: 5, score: 0 }),
    ]);
    const byTier = Object.fromEntries(groups.map((g) => [g.tier, g.rows]));
    // Top score is well above the mean → S; bottom well below → D.
    assert.equal(byTier.S[0]?.rank, 1);
    assert.equal(byTier.D[0]?.rank, 5);
    // Every series is placed exactly once.
    assert.equal(
      groups.reduce((n, g) => n + g.rows.length, 0),
      5,
    );
  });

  it("collapses an undifferentiated ranking to all-B", () => {
    const groups = groupRankingsIntoTiers([
      row({ rank: 1, score: 1500 }),
      row({ rank: 2, score: 1500 }),
      row({ rank: 3, score: 1500 }),
    ]);
    const byTier = Object.fromEntries(groups.map((g) => [g.tier, g.rows]));
    assert.equal(byTier.B.length, 3);
    assert.equal(byTier.S.length, 0);
    assert.equal(byTier.D.length, 0);
  });

  it("preserves ascending rank order within a tier", () => {
    const groups = groupRankingsIntoTiers([
      row({ rank: 3, score: 1500 }),
      row({ rank: 1, score: 1500 }),
      row({ rank: 2, score: 1500 }),
    ]);
    const b = groups.find((g) => g.tier === "B")!;
    assert.deepEqual(
      b.rows.map((r) => r.rank),
      [1, 2, 3],
    );
  });
});
