import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AniListMediaDetail } from "@/lib/anilist/types";

import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";

function media(overrides: Partial<AniListMediaDetail> = {}): AniListMediaDetail {
  return {
    id: 1,
    title: { romaji: "Romaji", english: "English", native: null },
    description: "<i>Desc</i>",
    coverImage: { large: "https://img.example/cover.jpg" },
    bannerImage: null,
    format: "TV",
    episodes: 12,
    duration: 24,
    season: "WINTER",
    seasonYear: 2020,
    status: "FINISHED",
    genres: ["Action"],
    averageScore: 80,
    meanScore: 78,
    popularity: 1000,
    trending: 5,
    favourites: 300,
    source: "MANGA",
    countryOfOrigin: "JP",
    hashtag: "#TestAnime",
    siteUrl: "https://anilist.co/anime/1",
    startDate: { year: 2020, month: 1, day: 7 },
    endDate: { year: 2020, month: 3, day: 24 },
    trailer: { id: "abc123", site: "youtube", thumbnail: "https://img.youtube.com/vi/abc123/0.jpg" },
    studios: {
      edges: [
        { isMain: true, node: { name: "Main Studio", siteUrl: null } },
        { isMain: false, node: { name: "Supporting Studio", siteUrl: null } },
      ],
    },
    tags: [
      { name: "Action", rank: 90, category: "Theme", isGeneralSpoiler: false, isMediaSpoiler: false, isAdult: false },
      { name: "Spoiler Tag", rank: 80, category: "Theme", isGeneralSpoiler: true, isMediaSpoiler: false, isAdult: false },
    ],
    rankings: [{ rank: 5, type: "RATED", allTime: true, context: "highest rated all time" }],
    externalLinks: [
      { site: "Crunchyroll", url: "https://crunchyroll.com/test", type: "STREAMING", language: null, isDisabled: false },
      { site: "Disabled", url: "https://disabled.com", type: "STREAMING", language: null, isDisabled: true },
    ],
    ...overrides,
  };
}

describe("mapAniListMediaToAnimeRow", () => {
  it("maps core fields and strips description html", () => {
    const row = mapAniListMediaToAnimeRow(media());
    assert.equal(row.anilist_id, 1);
    assert.equal(row.english_title, "English");
    assert.equal(row.description, "Desc");
    assert.deepEqual(row.genres, ["Action"]);
    assert.equal(row.cover_image_url, "https://img.example/cover.jpg");
  });

  it("falls back to display title when romaji missing", () => {
    const row = mapAniListMediaToAnimeRow(
      media({
        title: { romaji: null, english: "Only English", native: null },
      }),
    );
    assert.equal(row.romaji_title, "Only English");
  });

  it("maps new scalar fields", () => {
    const row = mapAniListMediaToAnimeRow(media());
    assert.equal(row.mean_score, 78);
    assert.equal(row.trending, 5);
    assert.equal(row.favourites, 300);
    assert.equal(row.country_of_origin, "JP");
    assert.equal(row.hashtag, "#TestAnime");
    assert.equal(row.site_url, "https://anilist.co/anime/1");
  });

  it("maps start_date and end_date as jsonb objects", () => {
    const row = mapAniListMediaToAnimeRow(media());
    assert.deepEqual(row.start_date, { year: 2020, month: 1, day: 7 });
    assert.deepEqual(row.end_date, { year: 2020, month: 3, day: 24 });
  });

  it("maps trailer as jsonb object", () => {
    const row = mapAniListMediaToAnimeRow(media());
    assert.deepEqual(row.trailer, { id: "abc123", site: "youtube", thumbnail: "https://img.youtube.com/vi/abc123/0.jpg" });
  });

  it("maps studios jsonb", () => {
    const row = mapAniListMediaToAnimeRow(media());
    const studios = row.studios as { edges: { isMain: boolean; node: { name: string } }[] };
    assert.equal(studios.edges[0].isMain, true);
    assert.equal(studios.edges[0].node.name, "Main Studio");
  });

  it("maps tags jsonb", () => {
    const row = mapAniListMediaToAnimeRow(media());
    assert.ok(Array.isArray(row.tags));
    assert.equal((row.tags as { name: string }[])[0].name, "Action");
  });

  it("maps rankings jsonb", () => {
    const row = mapAniListMediaToAnimeRow(media());
    assert.ok(Array.isArray(row.rankings));
    assert.equal((row.rankings as { rank: number }[])[0].rank, 5);
  });

  it("maps external_links jsonb", () => {
    const row = mapAniListMediaToAnimeRow(media());
    assert.ok(Array.isArray(row.external_links));
    assert.equal((row.external_links as { site: string }[])[0].site, "Crunchyroll");
  });

  it("handles null optional fields gracefully", () => {
    const row = mapAniListMediaToAnimeRow(
      media({
        meanScore: null,
        trending: null,
        favourites: null,
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
      }),
    );
    assert.equal(row.mean_score, null);
    assert.equal(row.trending, null);
    assert.equal(row.favourites, null);
    assert.equal(row.start_date, null);
    assert.equal(row.end_date, null);
    assert.equal(row.trailer, null);
    assert.equal(row.studios, null);
    assert.equal(row.tags, null);
    assert.equal(row.rankings, null);
    assert.equal(row.external_links, null);
  });
});
