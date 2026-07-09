import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeProfileStats } from "@/lib/profiles/stats";
import type { AnimeEntryStatus } from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";

function entry(status: AnimeEntryStatus, progress: number): LibraryEntry {
  return {
    id: `${status}-${progress}`,
    status,
    progress_episodes: progress,
    personal_score: null,
    completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
    anime: {
      genres: [],
      format: "TV",
      episodes: 12,
    },
  } as unknown as LibraryEntry;
}

describe("computeProfileStats", () => {
  it("sums watched episode progress across started statuses", () => {
    const stats = computeProfileStats(
      [
        entry("completed", 12),
        entry("watching", 5),
        entry("paused", 3),
        entry("dropped", 2),
        entry("plan_to_watch", 9),
      ],
      [],
      null,
    );

    assert.equal(stats.watchStyle.totalEpisodesWatched, 22);
  });
});
