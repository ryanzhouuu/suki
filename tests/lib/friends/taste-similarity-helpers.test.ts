import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Tables } from "@/types/database";

import {
  buildLovedUnwatched,
  buildCompareHighlightsFromRankings,
  buildSharedGenreStrength,
  buildSharedPlanToWatch,
  buildTasteDifferences,
  confidenceFromStats,
  emptyTasteCompareHighlights,
  type TasteMatchLibraryRow,
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

function entry(
  animeId: string,
  opts?: Partial<TasteMatchLibraryRow>,
): TasteMatchLibraryRow {
  return {
    anime_id: animeId,
    status: "completed",
    personal_score: null,
    priority: null,
    anime: {
      id: animeId,
      english_title: `${animeId}-en`,
      romaji_title: `${animeId}-ro`,
      cover_image_url: null,
      genres: [],
      format: "TV",
    },
    ...opts,
  };
}

describe("buildSharedGenreStrength", () => {
  it("ranks shared genres by combined strength", () => {
    const viewer = [
      entry("a", { anime: { ...entry("a").anime, genres: ["Drama", "Fantasy"] } }),
      entry("b", { anime: { ...entry("b").anime, genres: ["Drama"] } }),
    ];
    const friend = [
      entry("c", { anime: { ...entry("c").anime, genres: ["Drama", "Action"] } }),
      entry("d", { anime: { ...entry("d").anime, genres: ["Fantasy"] } }),
    ];

    const shared = buildSharedGenreStrength(viewer, friend);

    assert.deepEqual(shared[0], {
      genre: "Drama",
      viewerCount: 2,
      friendCount: 1,
      combinedCount: 3,
    });
    assert.deepEqual(shared[1], {
      genre: "Fantasy",
      viewerCount: 1,
      friendCount: 1,
      combinedCount: 2,
    });
  });
});

describe("buildTasteDifferences", () => {
  it("shows one-sided preference deltas", () => {
    const viewer = [
      entry("a", { anime: { ...entry("a").anime, genres: ["Drama", "Mystery"] } }),
      entry("b", { anime: { ...entry("b").anime, genres: ["Drama"] } }),
    ];
    const friend = [
      entry("c", { anime: { ...entry("c").anime, genres: ["Action"] } }),
      entry("d", { anime: { ...entry("d").anime, genres: ["Action"] } }),
    ];

    const diffs = buildTasteDifferences(viewer, friend);
    assert.deepEqual(diffs[0], {
      genre: "Action",
      viewerCount: 0,
      friendCount: 2,
      delta: -2,
    });
    assert.deepEqual(diffs[1], {
      genre: "Drama",
      viewerCount: 2,
      friendCount: 0,
      delta: 2,
    });
  });
});

describe("buildLovedUnwatched", () => {
  it("returns high-rated or completed entries missing from the other user", () => {
    const viewer = [
      entry("a", { personal_score: 9 }),
      entry("b", { personal_score: 7 }),
      entry("c", { status: "completed", personal_score: 10 }),
    ];
    const friend = [entry("a"), entry("x", { status: "watching" })];

    const picks = buildLovedUnwatched(viewer, friend);
    assert.equal(picks.length, 2);
    assert.equal(picks[0]?.animeId, "c");
    assert.equal(picks[1]?.animeId, "b");
  });
});

describe("buildSharedPlanToWatch", () => {
  it("intersects watchlists and orders by combined priority", () => {
    const viewer = [
      entry("a", { status: "plan_to_watch", priority: "high" }),
      entry("b", { status: "plan_to_watch", priority: "low" }),
    ];
    const friend = [
      entry("a", { status: "plan_to_watch", priority: "medium" }),
      entry("b", { status: "plan_to_watch", priority: "low" }),
      entry("z", { status: "plan_to_watch", priority: "high" }),
    ];

    const shared = buildSharedPlanToWatch(viewer, friend);
    assert.equal(shared.length, 2);
    assert.equal(shared[0]?.animeId, "a");
    assert.equal(shared[1]?.animeId, "b");
  });
});
