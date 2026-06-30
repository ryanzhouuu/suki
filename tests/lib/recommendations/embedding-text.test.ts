import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildAnimeEmbeddingText,
  buildTasteProfileText,
} from "@/lib/recommendations/embedding-text";
import type { TasteProfileSignals } from "@/lib/recommendations/types";

describe("buildAnimeEmbeddingText", () => {
  it("includes title, genres, and strips html from description", () => {
    const text = buildAnimeEmbeddingText(
      {
        id: "1",
        anilist_id: 1,
        romaji_title: "Test",
        english_title: "Test EN",
        native_title: null,
        description: "<p>Hello <b>world</b></p>",
        cover_image_url: null,
        banner_image_url: null,
        format: "TV",
        episodes: 12,
        duration_minutes: null,
        season: "FALL",
        season_year: 2024,
        status: "FINISHED",
        genres: ["Action", "Fantasy"],
        average_score: 85,
        mean_score: null,
        popularity: 1000,
        trending: null,
        favourites: null,
        source: "MANGA",
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
      },
      "Test Series",
    );

    assert.match(text, /Title: Test EN/);
    assert.match(text, /Series: Test Series/);
    assert.match(text, /Genres: Action, Fantasy/);
    assert.doesNotMatch(text, /<p>/);
    assert.match(text, /Hello world/);
  });

  it("includes year-only metadata when season is missing", () => {
    const text = buildAnimeEmbeddingText({
      id: "1",
      anilist_id: 2,
      romaji_title: "Show",
      english_title: null,
      native_title: null,
      description: null,
      cover_image_url: null,
      banner_image_url: null,
      format: null,
      episodes: null,
      duration_minutes: null,
      season: null,
      season_year: 2019,
      status: null,
      genres: [],
      average_score: null,
      mean_score: null,
      popularity: null,
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
    });
    assert.match(text, /Year: 2019/);
  });
});

describe("buildTasteProfileText", () => {
  it("includes ranked series and avoid genres", () => {
    const signals: TasteProfileSignals = {
      topRankedSeries: [{ id: "a", title: "Frieren", rank: 1 }],
      comparisonWinners: [],
      comparisonLosers: [],
      completedTitles: [],
      watchingTitles: [],
      droppedTitles: ["Bad Show"],
      topGenres: ["Fantasy"],
      topFormats: [],
      topSources: [],
      avoidGenres: ["Horror"],
    };

    const text = buildTasteProfileText(signals);
    assert.match(text, /Frieren/);
    assert.match(text, /Fantasy/);
    assert.match(text, /Horror/);
  });

  it("uses newcomer copy when signals are empty", () => {
    const text = buildTasteProfileText({
      topRankedSeries: [],
      comparisonWinners: [],
      comparisonLosers: [],
      completedTitles: [],
      watchingTitles: [],
      droppedTitles: [],
      topGenres: [],
      topFormats: [],
      topSources: [],
      avoidGenres: [],
    });
    assert.match(text, /new/i);
  });

  it("includes watching and dropped lists when present", () => {
    const text = buildTasteProfileText({
      topRankedSeries: [],
      comparisonWinners: [],
      comparisonLosers: [],
      completedTitles: ["Done"],
      watchingTitles: ["Now"],
      droppedTitles: ["Gone"],
      topGenres: [],
      topFormats: ["TV"],
      topSources: ["MANGA"],
      avoidGenres: [],
    });
    assert.match(text, /Currently watching: Now/);
    assert.match(text, /Dropped titles include: Gone/);
    assert.match(text, /Preferred formats: TV/);
  });
});
