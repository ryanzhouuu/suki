import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRecommendationInsertRows } from "@/lib/recommendations/persistence";
import type { ScoredRecommendation } from "@/lib/recommendations/types";

function recommendation(id: string, finalScore: number): ScoredRecommendation {
  return {
    anime: {
      id,
      anilist_id: Number(id.replace("anime-", "")),
      romaji_title: id,
      english_title: id,
      native_title: null,
      description: null,
      cover_image_url: null,
      banner_image_url: null,
      format: "TV",
      episodes: 12,
      duration_minutes: null,
      season: null,
      season_year: 2024,
      status: "FINISHED",
      genres: ["Action"],
      average_score: 80,
      popularity: 10_000,
      source: null,
      metadata_updated_at: new Date().toISOString(),
    },
    seriesId: null,
    similarityScore: 0.8,
    rerankScore: 0.4,
    finalScore,
    reasonCodes: [],
    explanation: `${id} explanation`,
    explanationDetails: {
      primaryReason: `${id} reason`,
      secondarySignals: [],
      matchedGenres: [],
      anchorTitles: [],
      badges: [],
    },
  };
}

describe("buildRecommendationInsertRows", () => {
  it("assigns sequential positions from sampler order", () => {
    const rows = buildRecommendationInsertRows(
      [
        recommendation("anime-1", 0.9),
        recommendation("anime-2", 0.4),
        recommendation("anime-3", 0.7),
      ],
      "run-1",
      "user-1",
      "algo-v1",
    );

    assert.deepEqual(
      rows.map((row) => row.position),
      [0, 1, 2],
    );
    assert.deepEqual(
      rows.map((row) => row.anime_id),
      ["anime-1", "anime-2", "anime-3"],
    );
    assert.equal(rows[1]?.final_score, 0.4);
  });
});
