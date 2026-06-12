import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  collaborativePrefsToRequestPrefs,
  rerankCollaborativeCandidates,
} from "@/lib/recommendations/collaborative-rerank";
import type { CollaborativeRecommendationPrefs } from "@/lib/recommendations/collaborative-types";
import { REASON_CODES } from "@/lib/recommendations/constants";
import type { CandidateAnime, TasteProfile } from "@/lib/recommendations/types";

const viewerProfile: TasteProfile = {
  userId: "viewer",
  inputHash: "viewer-hash",
  profileText: "viewer",
  signals: {
    topRankedSeries: [{ id: "vs1", title: "ViewerTop", rank: 1 }],
    comparisonWinners: [],
    comparisonLosers: [],
    completedTitles: [],
    watchingTitles: [],
    droppedTitles: [],
    topGenres: ["Drama", "Fantasy"],
    topFormats: ["TV"],
    topSources: [],
    avoidGenres: ["Horror"],
  },
};

const friendProfile: TasteProfile = {
  userId: "friend",
  inputHash: "friend-hash",
  profileText: "friend",
  signals: {
    topRankedSeries: [{ id: "fs1", title: "FriendTop", rank: 1 }],
    comparisonWinners: [],
    comparisonLosers: [],
    completedTitles: [],
    watchingTitles: [],
    droppedTitles: [],
    topGenres: ["Drama", "Comedy"],
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
    genres: ["Drama"],
    average_score: 80,
    popularity: 100_000,
    source: null,
    metadata_updated_at: new Date().toISOString(),
    seriesId: null,
    similarityScore: 0.8,
    ...overrides,
  };
}

describe("collaborativePrefsToRequestPrefs", () => {
  it("forces short length for short_watch mode when omitted", () => {
    const prefs: CollaborativeRecommendationPrefs = {
      mode: "short_watch",
      genres: [],
      format: null,
      lengthBucket: null,
      mood: null,
      adventurousness: "balanced",
    };
    const request = collaborativePrefsToRequestPrefs(prefs);
    assert.equal(request.lengthBucket, "short");
  });
});

describe("rerankCollaborativeCandidates", () => {
  it("adds collaborative reasons and both-user explanations", () => {
    const prefs: CollaborativeRecommendationPrefs = {
      mode: "best_shared_match",
      genres: [],
      format: null,
      lengthBucket: null,
      mood: null,
      adventurousness: "balanced",
    };

    const rec = rerankCollaborativeCandidates(
      viewerProfile,
      friendProfile,
      [candidate()],
      prefs,
    )[0];

    assert.ok(rec.reasonCodes.includes(REASON_CODES.collaborativeBothMatch));
    assert.match(rec.explanation, /ViewerTop|FriendTop/);
    assert.ok(rec.explanationDetails.anchorTitles.includes("ViewerTop"));
    assert.ok(rec.explanationDetails.anchorTitles.includes("FriendTop"));
  });
});
