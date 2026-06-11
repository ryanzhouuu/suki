import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAiringRows,
  formatTimeUntil,
  type AiringRow,
} from "@/lib/anime/airing";
import type { AniListAiringMedia } from "@/lib/anilist/types";
import type { LibraryEntry } from "@/lib/library/queries";

function entry(opts: {
  id: string;
  anilistId: number;
  progress: number;
  episodes?: number | null;
  english?: string;
}): LibraryEntry {
  return {
    id: opts.id,
    progress_episodes: opts.progress,
    anime: {
      anilist_id: opts.anilistId,
      episodes: opts.episodes ?? null,
      english_title: opts.english ?? "Show",
      romaji_title: opts.english ?? "Show",
      native_title: null,
      cover_image_url: null,
    },
  } as unknown as LibraryEntry;
}

function media(opts: {
  id: number;
  episode: number | null; // next episode number; null => no scheduled next episode
  airingAt?: number;
  episodes?: number | null;
}): AniListAiringMedia {
  return {
    id: opts.id,
    episodes: opts.episodes ?? null,
    status: opts.episode == null ? "FINISHED" : "RELEASING",
    nextAiringEpisode:
      opts.episode == null
        ? null
        : { episode: opts.episode, airingAt: opts.airingAt ?? 0 },
  };
}

function mapOf(...items: AniListAiringMedia[]): Map<number, AniListAiringMedia> {
  return new Map(items.map((m) => [m.id, m]));
}

describe("buildAiringRows", () => {
  it("excludes entries whose media has no scheduled next episode", () => {
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 3 })],
      mapOf(media({ id: 1, episode: null })),
    );
    assert.equal(rows.length, 0);
  });

  it("excludes entries with no matching media", () => {
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 3 })],
      mapOf(media({ id: 99, episode: 5 })),
    );
    assert.equal(rows.length, 0);
  });

  it("computes episodes behind as latest-aired minus progress", () => {
    // next episode is 8 => latest aired is 7; progress 3 => 4 behind
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 3 })],
      mapOf(media({ id: 1, episode: 8, airingAt: 100 })),
    );
    assert.equal(rows[0].episodesBehind, 4);
    assert.equal(rows[0].nextEpisodeNumber, 8);
  });

  it("clamps episodes behind to zero when caught up", () => {
    // next episode 8 => latest aired 7; progress 7 => 0 behind (not negative)
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 7 })],
      mapOf(media({ id: 1, episode: 8, airingAt: 100 })),
    );
    assert.equal(rows[0].episodesBehind, 0);
  });

  it("sorts rows by soonest airing first", () => {
    const rows = buildAiringRows(
      [
        entry({ id: "a", anilistId: 1, progress: 0 }),
        entry({ id: "b", anilistId: 2, progress: 0 }),
      ],
      mapOf(
        media({ id: 1, episode: 2, airingAt: 500 }),
        media({ id: 2, episode: 2, airingAt: 200 }),
      ),
    );
    assert.deepEqual(
      rows.map((r: AiringRow) => r.entryId),
      ["b", "a"],
    );
  });

  it("falls back to the cached anime episode count when AniList omits it", () => {
    const rows = buildAiringRows(
      [entry({ id: "a", anilistId: 1, progress: 0, episodes: 12 })],
      mapOf(media({ id: 1, episode: 2, airingAt: 100, episodes: null })),
    );
    assert.equal(rows[0].totalEpisodes, 12);
  });
});

describe("formatTimeUntil", () => {
  it("returns 'now' for non-positive input", () => {
    assert.equal(formatTimeUntil(0), "now");
    assert.equal(formatTimeUntil(-10), "now");
  });

  it("formats days and hours", () => {
    // 2 days, 4 hours
    assert.equal(formatTimeUntil((2 * 24 + 4) * 3600), "2d 4h");
  });

  it("formats hours and minutes when under a day", () => {
    assert.equal(formatTimeUntil(5 * 3600 + 12 * 60), "5h 12m");
  });

  it("formats minutes only when under an hour", () => {
    assert.equal(formatTimeUntil(8 * 60 + 30), "8m");
  });
});
