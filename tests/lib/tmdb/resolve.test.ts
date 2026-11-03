import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { withTmdbHeroArtwork } from "@/lib/tmdb/resolve";

const originalFetch = globalThis.fetch;
const previousKey = process.env.TMDB_API_KEY;

after(() => {
  globalThis.fetch = originalFetch;
  if (previousKey === undefined) delete process.env.TMDB_API_KEY;
  else process.env.TMDB_API_KEY = previousKey;
});

describe("withTmdbHeroArtwork", () => {
  it("keeps the AniList banner unless a mapped TMDB backdrop is available", async () => {
    const items = [
      { anilistId: 21, bannerUrl: "https://anilist.example/one.jpg" },
      { anilistId: 99, bannerUrl: "https://anilist.example/two.jpg" },
    ];

    delete process.env.TMDB_API_KEY;
    assert.deepEqual(await withTmdbHeroArtwork(items), items);

    process.env.TMDB_API_KEY = "test-key";
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    assert.deepEqual(await withTmdbHeroArtwork(items), items);

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("anime-list-full.json")) {
        return Response.json([
          { anilist_id: 21, themoviedb_id: { tv: 42 } },
          { anilist_id: 99 },
        ]);
      }
      if (url.includes("/3/tv/42")) {
        assert.match(url, /api_key=test-key/);
        return Response.json({ backdrop_path: "/hero.jpg" });
      }
      return new Response("missing", { status: 404 });
    }) as typeof fetch;

    const result = await withTmdbHeroArtwork(items);
    assert.equal(result[0]?.bannerUrl, "https://image.tmdb.org/t/p/original/hero.jpg");
    assert.equal(result[1]?.bannerUrl, "https://anilist.example/two.jpg");
  });
});
