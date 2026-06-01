import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { REASON_CODES } from "./constants";
import {
  buildExplanation,
  finalizeRecommendations,
  rerankCandidates,
} from "./rerank";
import type { CandidateAnime, TasteProfile } from "./types";

const baseProfile: TasteProfile = {
  userId: "user-1",
  inputHash: "abc",
  profileText: "test",
  signals: {
    topRankedSeries: [{ id: "s1", title: "Top", rank: 1 }],
    comparisonWinners: [],
    comparisonLosers: [],
    completedTitles: [],
    watchingTitles: [],
    droppedTitles: [],
    topGenres: ["Action"],
    topFormats: ["TV"],
    topSources: [],
    avoidGenres: ["Horror"],
  },
};

function candidate(overrides: Partial<CandidateAnime> = {}): CandidateAnime {
  return {
    id: "anime-1",
    anilist_id: 1,
    romaji_title: "A",
    english_title: "A",
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
    genres: ["Action"],
    average_score: 80,
    popularity: 100_000,
    source: null,
    metadata_updated_at: new Date().toISOString(),
    seriesId: null,
    similarityScore: 0.8,
    ...overrides,
  };
}

describe("rerankCandidates", () => {
  it("boosts matching genres and penalizes avoid genres", () => {
    const good = rerankCandidates(baseProfile, [candidate()])[0];
    const bad = rerankCandidates(
      baseProfile,
      [candidate({ genres: ["Horror"], similarityScore: 0.8 })],
    )[0];

    assert.ok(good.finalScore > bad.finalScore);
    assert.ok(good.reasonCodes.includes(REASON_CODES.topGenre));
    assert.ok(bad.reasonCodes.includes(REASON_CODES.droppedGenrePenalty));
  });
});

describe("buildExplanation", () => {
  it("mentions top genre overlap", () => {
    const rec = rerankCandidates(baseProfile, [candidate()])[0];
    const text = buildExplanation(rec, baseProfile);
    assert.match(text, /Action|rank/i);
  });

  it("uses semantic match copy when applicable", () => {
    const rec = rerankCandidates(baseProfile, [
      candidate({ genres: [], similarityScore: 0.9 }),
    ])[0];
    rec.reasonCodes = [REASON_CODES.semanticMatch];
    assert.match(buildExplanation(rec, baseProfile), /mood and themes/i);
  });

  it("falls back to generic suggestion", () => {
    const rec = rerankCandidates(baseProfile, [
      candidate({ genres: ["Sports"], similarityScore: 0.5 }),
    ])[0];
    rec.reasonCodes = [];
    assert.match(buildExplanation(rec, baseProfile), /watch history/i);
  });
});

describe("finalizeRecommendations", () => {
  it("adds explanations and sorts by final score", () => {
    const scored = finalizeRecommendations(baseProfile, [
      rerankCandidates(baseProfile, [
        candidate({ id: "low", similarityScore: 0.5 }),
      ])[0],
      rerankCandidates(baseProfile, [
        candidate({ id: "high", similarityScore: 0.9 }),
      ])[0],
    ]);

    assert.ok(scored[0].finalScore >= scored[1].finalScore);
    assert.ok(scored[0].explanation.length > 0);
  });
});
