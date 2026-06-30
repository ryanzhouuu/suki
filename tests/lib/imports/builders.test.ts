import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AniListMediaDetail } from "@/lib/anilist/types";
import {
  stagedRowFromAniListEntry,
  stagedRowFromMal,
} from "@/lib/imports/staged";

function media(id: number, romaji: string): AniListMediaDetail {
  return {
    id,
    title: { romaji, english: null, native: null },
    description: null,
    coverImage: { large: "https://img/cover.jpg" },
    bannerImage: null,
    format: "TV",
    episodes: 12,
    duration: 24,
    season: null,
    seasonYear: 2020,
    status: "FINISHED",
    genres: [],
    averageScore: null,
    meanScore: null,
    popularity: null,
    trending: null,
    favourites: null,
    source: null,
    countryOfOrigin: null,
    hashtag: null,
    siteUrl: null,
    startDate: null,
    endDate: null,
    trailer: null,
    studios: null,
    tags: null,
    rankings: null,
    externalLinks: null,
  };
}

describe("stagedRowFromMal", () => {
  it("builds a matched row from a MAL entry + resolved media", () => {
    const row = stagedRowFromMal(
      { malId: 21, title: "One Piece", rawStatus: "Watching", score: 9, watchedEpisodes: 1000 },
      media(21, "One Piece"),
    );
    assert.equal(row.matchState, "matched");
    assert.equal(row.anilistId, 21);
    assert.equal(row.status, "watching");
    assert.equal(row.personalScore, 9);
    assert.equal(row.progressEpisodes, 1000);
  });

  it("marks the row unmatched when no AniList media resolves", () => {
    const row = stagedRowFromMal(
      { malId: 999, title: "Obscure", rawStatus: "Completed", score: 0, watchedEpisodes: 5 },
      null,
    );
    assert.equal(row.matchState, "unmatched");
    assert.equal(row.anilistId, null);
    assert.equal(row.personalScore, null);
  });
});

describe("stagedRowFromAniListEntry", () => {
  it("builds a matched row, mapping status and rescaling the score", () => {
    const row = stagedRowFromAniListEntry(
      { status: "COMPLETED", score: 85, progress: 12, media: media(5114, "FMA") },
      "POINT_100",
    );
    assert.equal(row.matchState, "matched");
    assert.equal(row.anilistId, 5114);
    assert.equal(row.status, "completed");
    assert.equal(row.personalScore, 8.5);
    assert.equal(row.progressEpisodes, 12);
    assert.equal(row.media?.id, 5114);
  });

  it("defaults an unknown list status to plan_to_watch", () => {
    const row = stagedRowFromAniListEntry(
      { status: "WEIRD", score: 0, progress: 0, media: media(1, "X") },
      "POINT_10",
    );
    assert.equal(row.status, "plan_to_watch");
  });
});
