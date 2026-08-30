import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { TasteProfile } from "@/lib/recommendations/types";

type MatchRow = { anime_id: string; similarity: number };
type AnimeRow = { id: string; english_title: string };

let storedEmbedding: number[] | null = [1, 0, 0];
let matches: MatchRow[] = [];
let matchError: { message: string } | null = null;
let animeRows: AnimeRow[] = [];
let animeError: { message: string } | null = null;
let seriesMaps: { anime_id: string; series_id: string }[] = [];
let adminReads = 0;
let rpcArgs: Record<string, unknown> | null = null;

function serverQuery() {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({
      data: storedEmbedding ? { embedding: storedEmbedding } : null,
      error: null,
    }),
  };
  return query;
}

function adminQuery(table: string) {
  adminReads += 1;
  const query = {
    select: () => query,
    in: async () =>
      table === "anime"
        ? { data: animeRows, error: animeError }
        : { data: seriesMaps, error: null },
  };
  return query;
}

mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({
      from: () => serverQuery(),
      rpc: async (_name: string, args: Record<string, unknown>) => {
        rpcArgs = args;
        return { data: matches, error: matchError };
      },
    }),
  },
});
mock.module("@/lib/supabase/admin", {
  namedExports: {
    createAdminClient: () => ({ from: (table: string) => adminQuery(table) }),
  },
});

let getVectorCandidates: typeof import("@/lib/recommendations/candidates").getVectorCandidates;
let getVectorCandidatesForEmbedding: typeof import("@/lib/recommendations/candidates").getVectorCandidatesForEmbedding;

before(async () => {
  ({ getVectorCandidates, getVectorCandidatesForEmbedding } = await import(
    "@/lib/recommendations/candidates"
  ));
});

beforeEach(() => {
  storedEmbedding = [1, 0, 0];
  matches = [];
  matchError = null;
  animeRows = [];
  animeError = null;
  seriesMaps = [];
  adminReads = 0;
  rpcArgs = null;
});

const profile: TasteProfile = {
  userId: "viewer",
  inputHash: "input-hash",
  profileText: "profile",
  signals: {
    topRankedSeries: [],
    comparisonWinners: [],
    comparisonLosers: [],
    completedTitles: ["Completed"],
    watchingTitles: [],
    droppedTitles: [],
    topGenres: [],
    topFormats: [],
    topSources: [],
    avoidGenres: [],
  },
};

const exclusions = {
  excludedAnimeIds: ["watched"],
  excludedSeriesIds: ["watched-series"],
};

describe("getVectorCandidates", () => {
  it("requires a stored taste embedding", async () => {
    storedEmbedding = null;

    await assert.rejects(
      getVectorCandidates(profile, exclusions),
      /taste profile embedding is missing/i,
    );
  });

  it("uses the stored embedding for the vector match", async () => {
    await getVectorCandidates(profile, exclusions);

    assert.deepEqual(rpcArgs?.query_embedding, [1, 0, 0]);
  });
});

describe("getVectorCandidatesForEmbedding", () => {
  it("passes exclusions and the configured limit to vector matching", async () => {
    await getVectorCandidatesForEmbedding([0, 1, 0], exclusions);

    assert.deepEqual(rpcArgs, {
      query_embedding: [0, 1, 0],
      match_count: 200,
      excluded_anime_ids: ["watched"],
      excluded_series_ids: ["watched-series"],
    });
  });

  it("returns early when vector matching finds nothing", async () => {
    assert.deepEqual(
      await getVectorCandidatesForEmbedding([1, 0, 0], exclusions),
      [],
    );
    assert.equal(adminReads, 0);
  });

  it("enriches candidates with series and similarity then sorts descending", async () => {
    matches = [
      { anime_id: "anime-low", similarity: 0.4 },
      { anime_id: "anime-high", similarity: 0.9 },
    ];
    animeRows = [
      { id: "anime-low", english_title: "Low" },
      { id: "anime-high", english_title: "High" },
    ];
    seriesMaps = [{ anime_id: "anime-high", series_id: "series-high" }];

    const result = await getVectorCandidatesForEmbedding(
      [1, 0, 0],
      exclusions,
    );

    assert.deepEqual(
      result.map(({ id, seriesId, similarityScore }) => ({
        id,
        seriesId,
        similarityScore,
      })),
      [
        {
          id: "anime-high",
          seriesId: "series-high",
          similarityScore: 0.9,
        },
        { id: "anime-low", seriesId: null, similarityScore: 0.4 },
      ],
    );
  });

  it("propagates matching and anime lookup failures", async () => {
    matchError = { message: "match failed" };
    await assert.rejects(
      getVectorCandidatesForEmbedding([1], exclusions),
      /match failed/,
    );

    matchError = null;
    matches = [{ anime_id: "anime-1", similarity: 0.5 }];
    animeError = { message: "anime lookup failed" };
    await assert.rejects(
      getVectorCandidatesForEmbedding([1], exclusions),
      /anime lookup failed/,
    );
  });
});
