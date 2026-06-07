import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AniListMediaSummary } from "@/lib/anilist/types";
import {
  buildSearchCacheKey,
  getCachedSearch,
  resetSearchCacheForTests,
} from "@/lib/search/cache";

function media(id: number, title: string): AniListMediaSummary {
  return {
    id,
    title: { romaji: title, english: title, native: null },
    coverImage: null,
    format: "TV",
    episodes: 12,
    seasonYear: 2024,
    status: "FINISHED",
    genres: ["Action"],
  };
}

describe("buildSearchCacheKey", () => {
  it("normalizes query and genre order", () => {
    const a = buildSearchCacheKey({
      query: "  Naruto ",
      genres: ["Drama", "Action"],
      format: "TV",
      sort: "relevance",
    });
    const b = buildSearchCacheKey({
      query: "naruto",
      genres: ["action", "drama"],
      format: "TV",
      sort: "relevance",
    });

    assert.equal(a, b);
  });
});

describe("getCachedSearch", () => {
  it("returns cache misses before hits and expires by ttl", async () => {
    resetSearchCacheForTests();
    let calls = 0;

    const miss = await getCachedSearch(
      { query: "one piece", genres: [], format: null, sort: "relevance" },
      async () => {
        calls += 1;
        return [media(1, "One Piece")];
      },
      1_000,
    );
    const hit = await getCachedSearch(
      { query: "one piece", genres: [], format: null, sort: "relevance" },
      async () => {
        calls += 1;
        return [];
      },
      1_500,
    );
    const expired = await getCachedSearch(
      { query: "one piece", genres: [], format: null, sort: "relevance" },
      async () => {
        calls += 1;
        return [media(2, "One Piece 2")];
      },
      70_000,
    );

    assert.equal(miss.cacheHit, false);
    assert.equal(hit.cacheHit, true);
    assert.equal(expired.cacheHit, false);
    assert.equal(calls, 2);
  });

  it("deduplicates in-flight identical requests", async () => {
    resetSearchCacheForTests();
    let calls = 0;
    let resolve!: (value: AniListMediaSummary[]) => void;
    const pending = new Promise<AniListMediaSummary[]>(
      (res) => {
        resolve = res;
      },
    );

    const first = getCachedSearch(
      { query: "bleach", genres: ["Action"], format: null, sort: "relevance" },
      async () => {
        calls += 1;
        return pending;
      },
      10_000,
    );
    const second = getCachedSearch(
      { query: "bleach", genres: ["Action"], format: null, sort: "relevance" },
      async () => {
        calls += 1;
        return [];
      },
      10_000,
    );

    resolve([media(3, "Bleach")]);
    const [a, b] = await Promise.all([first, second]);

    assert.equal(calls, 1);
    assert.deepEqual(a.media, b.media);
    assert.equal(a.cacheHit, false);
    assert.equal(b.cacheHit, true);
  });
});
