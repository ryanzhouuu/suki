import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AniListMediaSummary } from "@/lib/anilist/types";
import { resetSearchCacheForTests } from "@/lib/search/cache";
import { resetSearchRateLimitForTests } from "@/lib/search/rate-limit";
import { handleSearchRequest } from "@/lib/search/route-handler";

function request(url: string, ip = "127.0.0.1"): Request {
  return new Request(url, {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

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

describe("handleSearchRequest", () => {
  it("returns 400 for invalid genres", async () => {
    resetSearchCacheForTests();
    resetSearchRateLimitForTests();

    const result = await handleSearchRequest(
      request("http://localhost:3000/api/search?genre=NotARealGenre"),
      {
        search: async () => [],
      },
    );

    assert.equal(result.status, 400);
    assert.match((result.body as { error: string }).error, /Invalid genre/i);
  });

  it("uses cache for repeated identical requests", async () => {
    resetSearchCacheForTests();
    resetSearchRateLimitForTests();

    let calls = 0;
    const search = async () => {
      calls += 1;
      return [media(10, "Naruto")];
    };

    const first = await handleSearchRequest(
      request("http://localhost:3000/api/search?q=naruto&genre=Action"),
      { search, nowMs: () => 1_000 },
    );
    const second = await handleSearchRequest(
      request("http://localhost:3000/api/search?q=naruto&genre=Action"),
      { search, nowMs: () => 1_500 },
    );

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(calls, 1);
    assert.equal(second.headers?.["X-Search-Cache"], "HIT");
  });

  it("returns 429 after too many requests from one client", async () => {
    resetSearchCacheForTests();
    resetSearchRateLimitForTests();

    const search = async () => [] as AniListMediaSummary[];
    let lastStatus = 200;
    let retryAfter = "";

    for (let i = 0; i < 31; i += 1) {
      const result = await handleSearchRequest(
        request("http://localhost:3000/api/search?q=bleach", "10.0.0.5"),
        { search, nowMs: () => 50_000 },
      );
      lastStatus = result.status;
      retryAfter = result.headers?.["Retry-After"] ?? "";
    }

    assert.equal(lastStatus, 429);
    assert.ok(Number(retryAfter) > 0);
  });
});
