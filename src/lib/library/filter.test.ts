import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterLibraryEntries } from "./filter";
import type { LibraryEntry } from "./queries";

function entry(genres: string[], title = "Test"): LibraryEntry {
  return {
    id: "e1",
    user_id: "u1",
    anime_id: "a1",
    status: "completed",
    progress_episodes: 1,
    rewatch_count: 0,
    priority: null,
    notes: null,
    personal_score: null,
    started_at: null,
    completed_at: null,
    created_at: "",
    updated_at: "",
    anime: {
      id: "a1",
      anilist_id: 1,
      romaji_title: title,
      english_title: title,
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
      average_score: null,
      popularity: null,
      source: null,
      metadata_updated_at: "",
    },
  };
}

describe("filterLibraryEntries", () => {
  const entries = [
    entry(["Action", "Fantasy"], "Action Show"),
    entry(["Romance"], "Romance Show"),
    entry([], "No Genre"),
  ];

  it("returns all entries when no filters", () => {
    assert.equal(filterLibraryEntries(entries, {}).length, 3);
  });

  it("filters by genre with OR semantics", () => {
    const result = filterLibraryEntries(entries, { genres: ["Action", "Romance"] });
    assert.equal(result.length, 2);
    assert.ok(result.some((e) => e.anime.english_title === "Action Show"));
    assert.ok(result.some((e) => e.anime.english_title === "Romance Show"));
  });

  it("combines title search and genre filter", () => {
    const result = filterLibraryEntries(entries, {
      query: "romance",
      genres: ["Romance"],
    });
    assert.equal(result.length, 1);
    assert.equal(result[0]?.anime.english_title, "Romance Show");
  });

  it("excludes entries with no matching genres when filter active", () => {
    const result = filterLibraryEntries(entries, { genres: ["Horror"] });
    assert.equal(result.length, 0);
  });
});
