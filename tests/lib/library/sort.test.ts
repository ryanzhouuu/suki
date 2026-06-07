import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { LibraryEntry } from "@/lib/library/queries";
import {
  defaultSortForStatus,
  sortLibraryEntries,
} from "@/lib/library/sort";

function entry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    id: "e1",
    user_id: "u1",
    anime_id: "a1",
    status: "plan_to_watch",
    progress_episodes: 0,
    rewatch_count: 0,
    priority: "medium",
    notes: null,
    personal_score: null,
    started_at: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
    anime: {
      id: "a1",
      anilist_id: 1,
      romaji_title: "Beta",
      english_title: "Beta",
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
      average_score: null,
      popularity: null,
      source: null,
      metadata_updated_at: "",
    },
    ...overrides,
  };
}

describe("defaultSortForStatus", () => {
  it("uses priority for plan to watch", () => {
    assert.equal(defaultSortForStatus("plan_to_watch"), "priority");
  });

  it("uses personal score for completed", () => {
    assert.equal(defaultSortForStatus("completed"), "personal_score");
  });
});

describe("sortLibraryEntries", () => {
  it("sorts plan to watch by priority then date added", () => {
    const entries = [
      entry({
        id: "low",
        priority: "low",
        created_at: "2024-03-01T00:00:00Z",
        anime: { ...entry().anime, english_title: "Low" },
      }),
      entry({
        id: "high",
        priority: "high",
        created_at: "2024-01-01T00:00:00Z",
        anime: { ...entry().anime, english_title: "High" },
      }),
    ];

    const sorted = sortLibraryEntries(entries, "priority");
    assert.equal(sorted[0]?.id, "high");
    assert.equal(sorted[1]?.id, "low");
  });

  it("keeps priority tie-breaker stable in descending order", () => {
    const entries = [
      entry({
        id: "high-new",
        priority: "high",
        created_at: "2024-03-01T00:00:00Z",
      }),
      entry({
        id: "high-old",
        priority: "high",
        created_at: "2024-01-01T00:00:00Z",
      }),
    ];

    const sorted = sortLibraryEntries(entries, "priority", "desc");
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["high-old", "high-new"],
    );
  });

  it("keeps priority tie-breaker stable in ascending order", () => {
    const entries = [
      entry({
        id: "low-new",
        priority: "low",
        created_at: "2024-03-01T00:00:00Z",
      }),
      entry({
        id: "low-old",
        priority: "low",
        created_at: "2024-01-01T00:00:00Z",
      }),
    ];

    const sorted = sortLibraryEntries(entries, "priority", "asc");
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["low-old", "low-new"],
    );
  });

  it("sorts completed by personal score", () => {
    const entries = [
      entry({
        id: "low-score",
        status: "completed",
        personal_score: 6,
      }),
      entry({
        id: "high-score",
        status: "completed",
        personal_score: 9,
      }),
    ];

    const sorted = sortLibraryEntries(entries, "personal_score");
    assert.equal(sorted[0]?.id, "high-score");
  });

  it("keeps personal score tie-breaker stable in descending order", () => {
    const entries = [
      entry({
        id: "score-later",
        status: "completed",
        personal_score: 9,
        completed_at: "2024-03-01",
      }),
      entry({
        id: "score-earlier",
        status: "completed",
        personal_score: 9,
        completed_at: "2024-01-01",
      }),
    ];

    const sorted = sortLibraryEntries(entries, "personal_score", "desc");
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["score-earlier", "score-later"],
    );
  });

  it("keeps personal score tie-breaker stable in ascending order", () => {
    const entries = [
      entry({
        id: "low-later",
        status: "completed",
        personal_score: 6,
        completed_at: "2024-03-01",
      }),
      entry({
        id: "low-earlier",
        status: "completed",
        personal_score: 6,
        completed_at: "2024-01-01",
      }),
    ];

    const sorted = sortLibraryEntries(entries, "personal_score", "asc");
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["low-earlier", "low-later"],
    );
  });

  it("keeps release year tie-breaker stable in descending order", () => {
    const entries = [
      entry({
        id: "z-title",
        anime: { ...entry().anime, english_title: "Zeta", season_year: 2020 },
      }),
      entry({
        id: "a-title",
        anime: { ...entry().anime, english_title: "Alpha", season_year: 2020 },
      }),
    ];

    const sorted = sortLibraryEntries(entries, "release_year", "desc");
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["a-title", "z-title"],
    );
  });
});
