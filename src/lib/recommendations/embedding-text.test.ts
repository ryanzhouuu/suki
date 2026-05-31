import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildAnimeEmbeddingText,
  buildTasteProfileText,
} from "./embedding-text";
import type { TasteProfileSignals } from "./types";

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
        popularity: 1000,
        source: "MANGA",
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
});
