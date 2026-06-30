import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { REASON_CODES } from "@/lib/recommendations/constants";
import {
  buildExplanation,
  buildExplanationDetails,
  finalizeRecommendations,
  rerankCandidates,
} from "@/lib/recommendations/rerank";
import type { RecommendationRequestPrefs } from "@/lib/recommendations/request-prefs";
import type { CandidateAnime, TasteProfile } from "@/lib/recommendations/types";

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
    mean_score: null,
    popularity: 100_000,
    trending: null,
    favourites: null,
    source: null,
    country_of_origin: null,
    hashtag: null,
    site_url: null,
    start_date: null,
    end_date: null,
    trailer: null,
    studios: null,
    tags: null,
    rankings: null,
    external_links: null,
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

  it("boosts request genre matches", () => {
    const prefs: RecommendationRequestPrefs = {
      genres: ["Romance"],
      lengthBucket: null,
      format: null,
      mood: null,
      adventurousness: "balanced",
    };
    const match = rerankCandidates(
      baseProfile,
      [candidate({ genres: ["Romance", "Action"] })],
      prefs,
    )[0];
    const miss = rerankCandidates(
      baseProfile,
      [candidate({ genres: ["Sports"] })],
      prefs,
    )[0];

    assert.ok(match.finalScore > miss.finalScore);
    assert.ok(match.reasonCodes.includes(REASON_CODES.requestGenreMatch));
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

  it("explains wildcard picks", () => {
    const rec = rerankCandidates(baseProfile, [candidate()])[0];
    rec.reasonCodes = [REASON_CODES.wildcardPick];
    assert.match(buildExplanation(rec, baseProfile), /adventurous/i);
  });

  it("tags strong matches as mood matches when a mood is set", () => {
    const prefs: RecommendationRequestPrefs = {
      genres: [],
      lengthBucket: null,
      format: null,
      mood: "cozy",
      adventurousness: "balanced",
    };
    const rec = rerankCandidates(
      baseProfile,
      [candidate({ genres: [], similarityScore: 0.9 })],
      prefs,
    )[0];
    assert.ok(rec.reasonCodes.includes(REASON_CODES.moodMatch));
    assert.match(buildExplanation(rec, baseProfile, prefs), /cozy pick/i);
  });

  it("quotes free-text moods in the explanation", () => {
    const prefs: RecommendationRequestPrefs = {
      genres: [],
      lengthBucket: null,
      format: null,
      mood: "something that'll wreck me",
      adventurousness: "balanced",
    };
    const rec = rerankCandidates(
      baseProfile,
      [candidate({ genres: [], similarityScore: 0.9 })],
      prefs,
    )[0];
    assert.match(
      buildExplanation(rec, baseProfile, prefs),
      /tuned to "something that'll wreck me"/i,
    );
  });
});

describe("buildExplanationDetails", () => {
  it("includes matched genres and badges", () => {
    const rec = rerankCandidates(baseProfile, [candidate()])[0];
    rec.explanation = buildExplanation(rec, baseProfile);
    const details = buildExplanationDetails(rec, baseProfile);

    assert.equal(details.primaryReason, rec.explanation);
    assert.ok(details.matchedGenres.includes("Action"));
    assert.ok(details.badges.includes("genre_match"));
    assert.ok(details.secondarySignals.length > 0);
  });

  it("adds wildcard badge for adventurous picks", () => {
    const rec = rerankCandidates(baseProfile, [candidate()])[0];
    rec.reasonCodes = [REASON_CODES.wildcardPick];
    rec.explanation = buildExplanation(rec, baseProfile);
    const details = buildExplanationDetails(rec, baseProfile);

    assert.ok(details.badges.includes("wildcard_pick"));
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
    assert.ok(scored[0].explanationDetails.primaryReason.length > 0);
  });

  it("keeps incoming order when preserveOrder is true", () => {
    const scored = finalizeRecommendations(
      baseProfile,
      [
        rerankCandidates(baseProfile, [
          candidate({ id: "first", similarityScore: 0.5 }),
        ])[0],
        rerankCandidates(baseProfile, [
          candidate({ id: "second", similarityScore: 0.9 }),
        ])[0],
      ],
      undefined,
      { preserveOrder: true },
    );

    assert.deepEqual(
      scored.map((rec) => rec.anime.id),
      ["first", "second"],
    );
  });
});
