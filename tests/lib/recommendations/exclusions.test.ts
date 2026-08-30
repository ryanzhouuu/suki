import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

type TestEntry = { anime_id: string };

const libraries = new Map<string, TestEntry[]>();
const dismissed = new Map<string, string[]>();
const seriesByAnime = new Map<string, string>();
let libraryReads: string[] = [];
let mappingReads: string[][] = [];
let mappingError: Error | null = null;

mock.module("@/lib/library/queries", {
  namedExports: {
    getUserLibraryEntries: async (userId: string) => {
      libraryReads.push(userId);
      return libraries.get(userId) ?? [];
    },
  },
});
mock.module("@/lib/recommendations/dismissed", {
  namedExports: {
    getDismissedAnimeIds: async (userId: string) => dismissed.get(userId) ?? [],
  },
});
mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({
      from: () => ({
        select: () => ({
          in: async (_column: string, animeIds: string[]) => {
            mappingReads.push(animeIds);
            return {
              data: animeIds.flatMap((animeId) => {
                const seriesId = seriesByAnime.get(animeId);
                return seriesId ? [{ series_id: seriesId }] : [];
              }),
              error: mappingError,
            };
          },
        }),
      }),
    }),
  },
});

let getRecommendationExclusions: typeof import("@/lib/recommendations/exclusions").getRecommendationExclusions;
let getCollaborativeRecommendationExclusions: typeof import("@/lib/recommendations/exclusions").getCollaborativeRecommendationExclusions;

before(async () => {
  ({ getRecommendationExclusions, getCollaborativeRecommendationExclusions } =
    await import("@/lib/recommendations/exclusions"));
});

beforeEach(() => {
  libraries.clear();
  dismissed.clear();
  seriesByAnime.clear();
  libraryReads = [];
  mappingReads = [];
  mappingError = null;
});

describe("getRecommendationExclusions", () => {
  it("returns early when the library and dismissal history are empty", async () => {
    assert.deepEqual(await getRecommendationExclusions("viewer"), {
      excludedAnimeIds: [],
      excludedSeriesIds: [],
    });
    assert.deepEqual(libraryReads, ["viewer"]);
    assert.deepEqual(mappingReads, []);
  });

  it("deduplicates library and dismissed anime plus their series", async () => {
    libraries.set("viewer", [{ anime_id: "anime-1" }, { anime_id: "anime-2" }]);
    dismissed.set("viewer", ["anime-2", "anime-3", "anime-3"]);
    seriesByAnime.set("anime-1", "series-a");
    seriesByAnime.set("anime-2", "series-a");
    seriesByAnime.set("anime-3", "series-b");

    assert.deepEqual(await getRecommendationExclusions("viewer"), {
      excludedAnimeIds: ["anime-1", "anime-2", "anime-3"],
      excludedSeriesIds: ["series-a", "series-b"],
    });
  });

  it("uses supplied entries without loading the library again", async () => {
    dismissed.set("viewer", ["dismissed"]);

    const result = await getRecommendationExclusions("viewer", [
      { anime_id: "provided" },
    ] as never);

    assert.deepEqual(result.excludedAnimeIds, ["provided", "dismissed"]);
    assert.deepEqual(libraryReads, []);
  });

  it("propagates series mapping failures", async () => {
    libraries.set("viewer", [{ anime_id: "anime-1" }]);
    mappingError = new Error("mapping failed");

    await assert.rejects(
      getRecommendationExclusions("viewer"),
      /mapping failed/,
    );
  });
});

describe("getCollaborativeRecommendationExclusions", () => {
  it("unions both users' anime and franchise exclusions", async () => {
    libraries.set("viewer", [{ anime_id: "viewer-anime" }]);
    libraries.set("friend", [{ anime_id: "friend-anime" }]);
    dismissed.set("friend", ["shared-anime"]);
    seriesByAnime.set("viewer-anime", "shared-series");
    seriesByAnime.set("friend-anime", "shared-series");
    seriesByAnime.set("shared-anime", "other-series");

    assert.deepEqual(
      await getCollaborativeRecommendationExclusions("viewer", "friend"),
      {
        excludedAnimeIds: ["viewer-anime", "friend-anime", "shared-anime"],
        excludedSeriesIds: ["shared-series", "other-series"],
      },
    );
  });
});
