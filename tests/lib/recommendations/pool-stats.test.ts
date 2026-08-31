import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

type QueryError = Error | null;

let exclusions = {
  excludedAnimeIds: [] as string[],
  excludedSeriesIds: [] as string[],
};
let libraryEntries: { anime_id: string }[] = [];
let embeddedCount: number | null = 0;
let embeddedRows: { anime_id: string }[] = [];
let seriesMaps: { anime_id: string; series_id: string }[] = [];
let countError: QueryError = null;
let embeddedRowsError: QueryError = null;
let mapsError: QueryError = null;
let mappingReads: string[][] = [];

function queryResult(table: string, head: boolean) {
  if (table === "anime_embeddings" && head) {
    return { data: null, count: embeddedCount, error: countError };
  }
  if (table === "anime_embeddings") {
    return { data: embeddedRows, count: null, error: embeddedRowsError };
  }
  return { data: seriesMaps, count: null, error: mapsError };
}

function queryFor(table: string) {
  let head = false;
  const query = {
    select: (_columns: string, options?: { head?: boolean }) => {
      head = options?.head ?? false;
      return query;
    },
    in: async (_column: string, animeIds: string[]) => {
      mappingReads.push(animeIds);
      return queryResult(table, head);
    },
    then: <TResult1 = unknown, TResult2 = never>(
      onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(queryResult(table, head)).then(onfulfilled, onrejected),
  };
  return query;
}

mock.module("@/lib/library/queries", {
  namedExports: {
    getUserLibraryEntries: async () => libraryEntries,
  },
});
mock.module("@/lib/recommendations/exclusions", {
  namedExports: {
    getRecommendationExclusions: async () => exclusions,
  },
});
mock.module("@/lib/supabase/admin", {
  namedExports: {
    createAdminClient: () => ({ from: (table: string) => queryFor(table) }),
  },
});

let getRecommendationPoolStats: typeof import("@/lib/recommendations/pool-stats").getRecommendationPoolStats;

before(async () => {
  ({ getRecommendationPoolStats } = await import(
    "@/lib/recommendations/pool-stats"
  ));
});

beforeEach(() => {
  exclusions = { excludedAnimeIds: [], excludedSeriesIds: [] };
  libraryEntries = [];
  embeddedCount = 0;
  embeddedRows = [];
  seriesMaps = [];
  countError = null;
  embeddedRowsError = null;
  mapsError = null;
  mappingReads = [];
});

describe("getRecommendationPoolStats", () => {
  it("reports an empty eligible pool without loading franchise mappings", async () => {
    embeddedCount = null;
    libraryEntries = [{ anime_id: "watched" }];

    assert.deepEqual(await getRecommendationPoolStats("viewer"), {
      embeddedCount: 0,
      libraryCount: 1,
      eligibleCount: 0,
    });
    assert.deepEqual(mappingReads, []);
  });

  it("excludes watched anime and every title in an excluded franchise", async () => {
    embeddedCount = 4;
    embeddedRows = [
      { anime_id: "watched" },
      { anime_id: "same-series" },
      { anime_id: "eligible-series" },
      { anime_id: "eligible-standalone" },
    ];
    seriesMaps = [
      { anime_id: "same-series", series_id: "blocked-series" },
      { anime_id: "eligible-series", series_id: "open-series" },
    ];
    exclusions = {
      excludedAnimeIds: ["watched"],
      excludedSeriesIds: ["blocked-series"],
    };
    libraryEntries = [{ anime_id: "watched" }, { anime_id: "other" }];

    assert.deepEqual(await getRecommendationPoolStats("viewer"), {
      embeddedCount: 4,
      libraryCount: 2,
      eligibleCount: 2,
    });
    assert.deepEqual(mappingReads, [
      ["watched", "same-series", "eligible-series", "eligible-standalone"],
    ]);
  });

  it("propagates failures from each pool query", async () => {
    countError = new Error("count failed");
    await assert.rejects(getRecommendationPoolStats("viewer"), /count failed/);

    countError = null;
    embeddedRowsError = new Error("rows failed");
    await assert.rejects(getRecommendationPoolStats("viewer"), /rows failed/);

    embeddedRowsError = null;
    embeddedRows = [{ anime_id: "anime-1" }];
    mapsError = new Error("maps failed");
    await assert.rejects(getRecommendationPoolStats("viewer"), /maps failed/);
  });
});
