import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAiringRows,
  formatAiringCredit,
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

describe("formatAiringCredit", () => {
  const zone = "UTC";
  const now = Date.parse("2026-11-02T12:00:00Z");

  function at(iso: string) {
    return Math.floor(Date.parse(iso) / 1000);
  }

  it("says Out now once the episode has aired", () => {
    assert.deepEqual(formatAiringCredit(at("2026-11-02T11:00:00Z"), now, zone), {
      day: "Out now",
      time: null,
      soon: true,
    });
  });

  it("says Tonight from 5 PM and Today earlier the same day", () => {
    const tonight = formatAiringCredit(at("2026-11-02T22:30:00Z"), now, zone);
    assert.equal(tonight.day, "Tonight");
    assert.equal(tonight.soon, true);
    assert.match(tonight.time ?? "", /10:30\s*PM/);

    const afternoon = formatAiringCredit(at("2026-11-02T14:00:00Z"), now, zone);
    assert.equal(afternoon.day, "Today");
    assert.equal(afternoon.soon, true);
    assert.match(afternoon.time ?? "", /2:00\s*PM/);
  });

  it("converts the instant into the given timezone", () => {
    const denver = formatAiringCredit(at("2026-11-04T02:30:00Z"), now, "America/Denver");
    assert.equal(denver.day, "Tue");
    assert.match(denver.time ?? "", /7:30\s*PM/);
  });

  it("uses a weekday inside the next week and a date after that", () => {
    const wednesday = formatAiringCredit(at("2026-11-04T09:00:00Z"), now, zone);
    assert.equal(wednesday.day, "Wed");
    assert.equal(wednesday.soon, false);
    assert.match(wednesday.time ?? "", /9:00\s*AM/);

    const later = formatAiringCredit(at("2026-11-14T15:00:00Z"), now, zone);
    assert.equal(later.day, "Nov 14");
    assert.equal(later.time, null);
    assert.equal(later.soon, false);
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
