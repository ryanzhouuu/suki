import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  backdropImageUrl,
  fetchTmdbBackdrop,
  indexAnilistTmdb,
  preferTmdbBackdrops,
  tmdbTargetFromRecord,
} from "@/lib/tmdb/artwork";

describe("tmdbTargetFromRecord", () => {
  it("uses the TV id when the map has one", () => {
    assert.deepEqual(
      tmdbTargetFromRecord({ anilist_id: 21, themoviedb_id: { tv: 37854 } }),
      { mediaType: "tv", id: 37854 },
    );
  });

  it("uses the first movie id when there is no TV id", () => {
    assert.deepEqual(
      tmdbTargetFromRecord({ anilist_id: 164, themoviedb_id: { movie: [128, 999] } }),
      { mediaType: "movie", id: 128 },
    );
  });

  it("returns null when the record has no TMDB id", () => {
    assert.equal(tmdbTargetFromRecord({ anilist_id: 1 }), null);
    assert.equal(tmdbTargetFromRecord({ anilist_id: 1, themoviedb_id: { movie: [] } }), null);
  });
});

describe("indexAnilistTmdb", () => {
  it("indexes only records that have both an AniList id and a TMDB target", () => {
    const index = indexAnilistTmdb([
      { anilist_id: 21, themoviedb_id: { tv: 37854 } },
      { anilist_id: 164, themoviedb_id: { movie: [128] } },
      { themoviedb_id: { tv: 1 } },
      { anilist_id: 5 },
    ]);
    assert.equal(index.size, 2);
    assert.deepEqual(index.get(164), { mediaType: "movie", id: 128 });
  });
});

describe("backdropImageUrl", () => {
  it("builds an original-size image URL and drops a missing path", () => {
    assert.equal(
      backdropImageUrl("/abc.jpg"),
      "https://image.tmdb.org/t/p/original/abc.jpg",
    );
    assert.equal(backdropImageUrl(null), null);
    assert.equal(backdropImageUrl(""), null);
  });
});

describe("fetchTmdbBackdrop", () => {
  it("requests the mapped title and returns its backdrop", async () => {
    let requested = "";
    const fetchImpl: typeof fetch = async (input) => {
      requested = String(input);
      return new Response(JSON.stringify({ backdrop_path: "/hero.jpg" }));
    };

    const url = await fetchTmdbBackdrop({ mediaType: "tv", id: 42 }, "test-key", fetchImpl);

    assert.equal(url, "https://image.tmdb.org/t/p/original/hero.jpg");
    assert.match(requested, /\/3\/tv\/42\?/);
    assert.match(requested, /api_key=test-key/);
  });

  it("returns null when TMDB has no backdrop or the request fails", async () => {
    const empty: typeof fetch = async () =>
      new Response(JSON.stringify({ backdrop_path: null }));
    assert.equal(
      await fetchTmdbBackdrop({ mediaType: "movie", id: 1 }, "test-key", empty),
      null,
    );

    const failed: typeof fetch = async () => new Response("nope", { status: 404 });
    assert.equal(
      await fetchTmdbBackdrop({ mediaType: "tv", id: 1 }, "test-key", failed),
      null,
    );
  });
});

describe("preferTmdbBackdrops", () => {
  it("replaces banner art when a backdrop exists and keeps it otherwise", async () => {
    const items = [
      { anilistId: 21, bannerUrl: "https://anilist.example/banner.jpg" },
      { anilistId: 99, bannerUrl: "https://anilist.example/other.jpg" },
    ];
    const lookup = async (anilistId: number) =>
      anilistId === 21 ? "https://image.tmdb.org/t/p/original/hero.jpg" : null;

    const result = await preferTmdbBackdrops(items, lookup);

    assert.equal(result[0].bannerUrl, "https://image.tmdb.org/t/p/original/hero.jpg");
    assert.equal(result[1].bannerUrl, "https://anilist.example/other.jpg");
  });

  it("keeps the AniList banner when the lookup fails", async () => {
    const items = [{ anilistId: 21, bannerUrl: "https://anilist.example/banner.jpg" }];
    const result = await preferTmdbBackdrops(items, async () => {
      throw new Error("tmdb down");
    });
    assert.equal(result[0].bannerUrl, "https://anilist.example/banner.jpg");
  });
});
