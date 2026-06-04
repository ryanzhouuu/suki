import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { REASON_CODES } from "@/lib/recommendations/constants";
import { EMPTY_REQUEST_PREFS } from "@/lib/recommendations/request-prefs";
import { sampleAdventurous } from "@/lib/recommendations/sampler";
import type { ScoredRecommendation } from "@/lib/recommendations/types";

function rec(
  id: string,
  finalScore: number,
  similarityScore: number,
  genres: string[] = ["Action"],
): ScoredRecommendation {
  return {
    anime: {
      id,
      anilist_id: 1,
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
      season_year: 2020,
      status: "FINISHED",
      genres,
      average_score: 80,
      popularity: 10_000,
      source: null,
      metadata_updated_at: new Date().toISOString(),
    },
    seriesId: null,
    similarityScore,
    rerankScore: 0.5,
    finalScore,
    reasonCodes: [],
    explanation: "",
    explanationDetails: {
      primaryReason: "",
      secondarySignals: [],
      matchedGenres: [],
      anchorTitles: [],
      badges: [],
    },
  };
}

describe("sampleAdventurous", () => {
  const pool = Array.from({ length: 40 }, (_, i) =>
    rec(
      `id-${i}`,
      1 - i * 0.01,
      0.9 - i * 0.01,
      i % 3 === 0 ? ["Sports"] : ["Action"],
    ),
  );

  it("returns stable order for the same seed", () => {
    const a = sampleAdventurous(pool, EMPTY_REQUEST_PREFS, "seed-a", 20);
    const b = sampleAdventurous(pool, EMPTY_REQUEST_PREFS, "seed-a", 20);
    assert.deepEqual(
      a.map((r) => r.anime.id),
      b.map((r) => r.anime.id),
    );
  });

  it("returns different order for different seeds", () => {
    const a = sampleAdventurous(pool, EMPTY_REQUEST_PREFS, "seed-a", 20);
    const b = sampleAdventurous(pool, EMPTY_REQUEST_PREFS, "seed-b", 20);
    const sameOrder = a.every((r, i) => r.anime.id === b[i]?.anime.id);
    assert.equal(sameOrder, false);
  });

  it("includes wildcard and diverse reason codes when pool is large", () => {
    const sampled = sampleAdventurous(pool, EMPTY_REQUEST_PREFS, "wild-seed", 20);
    const codes = new Set(sampled.flatMap((r) => r.reasonCodes));
    assert.ok(
      codes.has(REASON_CODES.diversePick) || codes.has(REASON_CODES.wildcardPick),
    );
  });

  it("respects limit", () => {
    assert.equal(
      sampleAdventurous(pool, EMPTY_REQUEST_PREFS, "x", 10).length,
      10,
    );
  });
});
