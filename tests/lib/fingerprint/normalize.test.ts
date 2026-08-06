import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeFingerprintInput } from "@/lib/fingerprint/normalize";

import { anime, entry, mapping, ranking, series } from "./fixtures";

describe("normalizeFingerprintInput", () => {
  it("collapses seasons and movies into one franchise without double-counting signals", () => {
    const first = entry("franchise-season-1", {
      status: "completed",
      rewatch_count: 1,
      personal_score: 8,
      anime: anime("franchise-season-1", {
        genres: ["Action", "Drama"],
        tags: [
          { name: "Time Travel", isAdult: false, isGeneralSpoiler: false, isMediaSpoiler: false },
          { name: "Spoiler", isAdult: false, isGeneralSpoiler: true, isMediaSpoiler: false },
        ],
        episodes: 12,
        format: "TV",
        popularity: 2_000,
      }),
    });
    const second = entry("franchise-movie", {
      status: "watching",
      rewatch_count: 2,
      personal_score: 9,
      anime: anime("franchise-movie", {
        genres: ["action", "Drama"],
        tags: [
          { name: "time travel", isAdult: false, isGeneralSpoiler: false, isMediaSpoiler: false },
          { name: "Adult", isAdult: true, isGeneralSpoiler: false, isMediaSpoiler: false },
        ],
        episodes: 1,
        format: "MOVIE",
        popularity: 20_000,
      }),
    });

    const result = normalizeFingerprintInput({
      entries: [second, first],
      rankings: [ranking("series-1", 1)],
      seriesByAnimeId: mapping([
        ["franchise-movie", series("series-1", "The Franchise")],
        ["franchise-season-1", series("series-1", "The Franchise")],
      ]),
    });

    assert.equal(result.franchises.length, 1);
    const franchise = result.franchises[0];
    assert.equal(franchise.id, "series-1");
    assert.deepEqual(franchise.animeIds, ["franchise-movie", "franchise-season-1"]);
    assert.deepEqual(franchise.genres, ["action", "drama"]);
    assert.deepEqual(franchise.tags, ["time travel"]);
    assert.deepEqual(franchise.formats, ["MOVIE", "TV"]);
    assert.deepEqual(franchise.completedFormats, ["TV"]);
    assert.equal(franchise.popularity, 20_000);
    assert.equal(franchise.completedEpisodeTotal, 12);
    assert.equal(franchise.totalRewatchCount, 3);
    assert.equal(franchise.hasCompleted, true);
    assert.equal(franchise.hasWatching, true);
    assert.equal(franchise.isSettled, false);
  });

  it("uses stable standalone keys for unmapped anime", () => {
    const result = normalizeFingerprintInput({
      entries: [entry("unmapped-anime")],
      rankings: [],
      seriesByAnimeId: new Map(),
    });

    assert.equal(result.franchises[0].id, "anime:unmapped-anime");
    assert.equal(result.franchises[0].series, null);
  });

  it("ignores malformed, spoiler, and adult tags", () => {
    const result = normalizeFingerprintInput({
      entries: [
        entry("tagged", {
          anime: anime("tagged", {
            tags: [
              null,
              "not an object",
              { name: "Missing flags" },
              { name: " Safe Theme ", isAdult: false, isGeneralSpoiler: false, isMediaSpoiler: false },
              { name: "spoiler", isAdult: false, isGeneralSpoiler: true, isMediaSpoiler: false },
              { name: "adult", isAdult: true, isGeneralSpoiler: false, isMediaSpoiler: false },
              { name: "", isAdult: false, isGeneralSpoiler: false, isMediaSpoiler: false },
            ],
          }),
        }),
      ],
      rankings: [],
      seriesByAnimeId: new Map(),
    });

    assert.deepEqual(result.franchises[0].tags, ["safe theme"]);
  });

  it("excludes zero and unknown episode metadata from completed length facts", () => {
    const result = normalizeFingerprintInput({
      entries: [
        entry("zero", { anime: anime("zero", { episodes: 0 }) }),
        entry("unknown", { anime: anime("unknown", { episodes: null }) }),
      ],
      rankings: [],
      seriesByAnimeId: mapping([
        ["zero", series("zero-series")],
        ["unknown", series("unknown-series")],
      ]),
    });

    assert.equal(result.franchises[0].completedEpisodeTotal, null);
    assert.equal(result.franchises[0].completedEpisodeMetadataComplete, false);
    assert.equal(result.franchises[1].completedEpisodeTotal, null);
  });

  it("clamps rank percentiles for gapped or malformed rank positions", () => {
    const result = normalizeFingerprintInput({
      entries: [entry("a", { anime: anime("a") }), entry("b", { anime: anime("b") })],
      rankings: [ranking("series-a", 100), ranking("series-b", 2)],
      seriesByAnimeId: mapping([
        ["a", series("series-a")],
        ["b", series("series-b")],
      ]),
    });

    assert.equal(result.franchises[0].ranking?.rankPercentile, 0);
    assert.equal(result.franchises[1].ranking?.rankPercentile, 1);
  });
});
