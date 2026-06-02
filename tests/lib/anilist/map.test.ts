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
    popularity: 1000,
    source: "MANGA",
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
});
