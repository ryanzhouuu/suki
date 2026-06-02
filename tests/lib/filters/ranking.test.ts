import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Tables } from "@/types/database";

import { filterRankingsByGenre } from "@/lib/filters/ranking";

type Row = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

function row(seriesId: string, rank = 1): Row {
  return {
    id: seriesId,
    user_id: "u1",
    series_id: seriesId,
    rank,
    score: 1500,
    comparison_count: 0,
    confidence: "low",
    algorithm_version: "elo_series_v1",
    computed_at: new Date().toISOString(),
    series: null,
  };
}

describe("filterRankingsByGenre", () => {
  it("filters rankings by series genre map", () => {
    const rankings = [row("s1"), row("s2")];
    const genresBySeriesId = {
      s1: ["Action"],
      s2: ["Comedy"],
    };

    const filtered = filterRankingsByGenre(rankings, ["Action"], genresBySeriesId);
    assert.deepEqual(filtered.map((r) => r.series_id), ["s1"]);
  });

  it("returns all when no genre filter", () => {
    const rankings = [row("s1"), row("s2")];
    const filtered = filterRankingsByGenre(rankings, [], {});
    assert.equal(filtered.length, 2);
  });
});
