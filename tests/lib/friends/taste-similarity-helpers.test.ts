import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Tables } from "@/types/database";

import {
  buildCompareHighlightsFromRankings,
  confidenceFromStats,
  emptyTasteCompareHighlights,
} from "@/lib/friends/taste-similarity-helpers";

function series(id: string, title: string): Tables<"series"> {
  return {
    id,
    canonical_title: title,
    cover_image_url: null,
    anilist_primary_id: 1,
    slug: title,
    created_at: "",
    updated_at: "",
  };
}

describe("confidenceFromStats", () => {
  it("returns high when both users are data-rich", () => {
    assert.equal(
      confidenceFromStats(
        { completed: 10, comparisons: 5 },
        { completed: 8, comparisons: 4 },
      ),
      "high",
    );
  });

  it("returns medium with modest libraries", () => {
    assert.equal(
      confidenceFromStats(
        { completed: 3, comparisons: 0 },
        { completed: 2, comparisons: 1 },
      ),
      "medium",
    );
  });

  it("returns low otherwise", () => {
    assert.equal(
      confidenceFromStats(
        { completed: 1, comparisons: 0 },
        { completed: 5, comparisons: 10 },
      ),
      "low",
    );
  });
});

describe("buildCompareHighlightsFromRankings", () => {
  it("picks aligned favorites and biggest disagreements", () => {
    const highlights = buildCompareHighlightsFromRankings(
      [
        { rank: 1, series_id: "a", series: series("a", "A") },
        { rank: 5, series_id: "b", series: series("b", "B") },
      ],
      [
        { rank: 2, series_id: "a", series: series("a", "A") },
        { rank: 10, series_id: "b", series: series("b", "B") },
      ],
      3,
      2,
    );

    assert.equal(highlights.sharedCompletedSeriesCount, 3);
    assert.equal(highlights.sharedFavorites[0]?.seriesId, "a");
    assert.equal(highlights.sharedFavorites[0]?.rankDelta, 1);
    assert.equal(highlights.biggestDisagreements[0]?.seriesId, "b");
    assert.equal(highlights.biggestDisagreements[0]?.rankDelta, 5);
  });

  it("skips rows without overlapping series or missing series", () => {
    const highlights = buildCompareHighlightsFromRankings(
      [{ rank: 1, series_id: "solo", series: series("solo", "Solo") }],
      [],
      0,
    );
    assert.deepEqual(highlights.sharedFavorites, []);
    assert.deepEqual(highlights.biggestDisagreements, []);
  });
});

describe("emptyTasteCompareHighlights", () => {
  it("returns empty structure", () => {
    assert.deepEqual(emptyTasteCompareHighlights(), {
      sharedFavorites: [],
      biggestDisagreements: [],
      sharedCompletedSeriesCount: 0,
    });
  });
});
