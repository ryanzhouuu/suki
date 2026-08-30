import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

const viewerId = "00000000-0000-4000-8000-000000000001";
const friendId = "00000000-0000-4000-8000-000000000002";

type QueryResult = { data: unknown; error: null };
type FakeQuery = {
  select: (columns?: string, options?: unknown) => FakeQuery;
  eq: (column: string, value: unknown) => FakeQuery;
  in: (column: string, values: unknown[]) => FakeQuery;
  order: (column: string, options?: unknown) => FakeQuery;
  limit: (count: number) => FakeQuery;
  maybeSingle: () => Promise<QueryResult>;
  then: <TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) => Promise<TResult1 | TResult2>;
};

type TestEntry = ReturnType<typeof entry>;
type TestProfile = ReturnType<typeof profile>;

let embeddingConfigured = true;
let friendship: Record<string, unknown> | null = null;
const libraries = new Map<string, TestEntry[]>();
const rankings = new Map<string, Record<string, unknown>[]>();
const comparisons = new Map<string, Record<string, unknown>[]>();
const seriesByAnimeId = new Map<string, string>();
const storedProfiles = new Map<string, Record<string, unknown>>();
const tasteProfiles = new Map<string, TestProfile>();
const generatedEmbeddings = new Map<string, number[] | null>();
const upsertCalls: string[] = [];
let serverQueryCount = 0;

function entry(
  animeId: string,
  status: "watching" | "completed" | "paused" | "dropped" | "plan_to_watch",
  options: {
    score?: number | null;
    priority?: "low" | "medium" | "high" | null;
    genres?: string[];
    format?: string | null;
  } = {},
) {
  return {
    anime_id: animeId,
    status,
    personal_score: options.score ?? null,
    priority: options.priority ?? null,
    anime: {
      id: animeId,
      english_title: `Title ${animeId}`,
      romaji_title: `Romaji ${animeId}`,
      cover_image_url: null,
      genres: options.genres ?? [],
      format: options.format ?? "TV",
    },
  };
}

function profile(userId: string) {
  return {
    userId,
    inputHash: `hash-${userId}`,
    profileText: `Taste profile for ${userId}`,
    signals: {
      topRankedSeries: [],
      comparisonWinners: [],
      comparisonLosers: [],
      completedTitles: ["Completed title"],
      watchingTitles: [],
      droppedTitles: [],
      topGenres: [],
      topFormats: [],
      topSources: [],
      avoidGenres: [],
    },
  };
}

function seriesRow(seriesId: string, rank: number) {
  return {
    rank,
    series_id: seriesId,
    series: {
      id: seriesId,
      canonical_title: `Series ${seriesId}`,
      cover_image_url: null,
    },
  };
}

function comparison(index: number) {
  return {
    left_series_id: `left-${index}`,
    right_series_id: `right-${index}`,
    winner_series_id: `left-${index}`,
  };
}

function resolveQuery(
  source: "server" | "admin",
  table: string,
  filters: Map<string, unknown>,
): QueryResult {
  const userId = String(filters.get("user_id") ?? "");
  if (source === "admin") {
    return { data: storedProfiles.get(userId) ?? null, error: null };
  }

  if (table === "pairwise_series_comparisons") {
    return { data: comparisons.get(userId) ?? [], error: null };
  }
  if (table === "derived_series_rankings") {
    return { data: rankings.get(userId) ?? [], error: null };
  }
  if (table === "user_anime_entries") {
    const data = (libraries.get(userId) ?? [])
      .filter((item) => item.status === "completed")
      .map((item) => ({ anime_id: item.anime_id }));
    return { data, error: null };
  }
  if (table === "anime_series_map") {
    const animeIds = (filters.get("anime_id") as unknown[] | undefined) ?? [];
    const data = animeIds.flatMap((animeId) => {
      const seriesId = seriesByAnimeId.get(String(animeId));
      return seriesId ? [{ series_id: seriesId }] : [];
    });
    return { data, error: null };
  }
  return { data: [], error: null };
}

function queryFor(source: "server" | "admin", table: string): FakeQuery {
  if (source === "server") serverQueryCount += 1;
  const filters = new Map<string, unknown>();
  const query: FakeQuery = {
    select(columns, options) {
      void columns;
      void options;
      return query;
    },
    eq(column, value) {
      filters.set(column, value);
      return query;
    },
    in(column, values) {
      filters.set(column, values);
      return query;
    },
    order(column, options) {
      void column;
      void options;
      return query;
    },
    limit(count) {
      void count;
      return query;
    },
    maybeSingle: async () => resolveQuery(source, table, filters),
    then(onfulfilled, onrejected) {
      return Promise.resolve(resolveQuery(source, table, filters)).then(
        onfulfilled,
        onrejected,
      );
    },
  };
  return query;
}

mock.module("@/lib/friends/queries", {
  namedExports: {
    getFriendshipBetween: async () => friendship,
  },
});
mock.module("@/lib/library/queries", {
  namedExports: {
    getUserLibraryEntries: async (userId: string) => libraries.get(userId) ?? [],
  },
});
mock.module("@/lib/recommendations/constants", {
  namedExports: {
    EMBEDDING_DIMENSIONS: 3,
    EMBEDDING_MODEL: "test-model",
  },
});
mock.module("@/lib/recommendations/embedding-provider", {
  namedExports: {
    isEmbeddingConfigured: () => embeddingConfigured,
  },
});
mock.module("@/lib/recommendations/taste-profile", {
  namedExports: {
    buildTasteProfile: async (userId: string) =>
      tasteProfiles.get(userId) ?? profile(userId),
  },
});
mock.module("@/lib/recommendations/taste-embedding", {
  namedExports: {
    upsertUserTasteEmbedding: async (tasteProfile: TestProfile) => {
      upsertCalls.push(tasteProfile.userId);
      return generatedEmbeddings.get(tasteProfile.userId) ?? null;
    },
  },
});
mock.module("@/lib/supabase/admin", {
  namedExports: {
    createAdminClient: () => ({
      from: (table: string) => queryFor("admin", table),
    }),
  },
});
mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({
      from: (table: string) => queryFor("server", table),
    }),
  },
});

let getTasteSimilarity: typeof import("@/lib/friends/taste-similarity").getTasteSimilarity;
let getTasteCompareHighlights: typeof import("@/lib/friends/taste-similarity").getTasteCompareHighlights;
let getTasteMatchProfile: typeof import("@/lib/friends/taste-similarity").getTasteMatchProfile;

before(async () => {
  ({ getTasteSimilarity, getTasteCompareHighlights, getTasteMatchProfile } =
    await import("@/lib/friends/taste-similarity"));
});

beforeEach(() => {
  embeddingConfigured = true;
  friendship = {
    requester_id: viewerId,
    recipient_id: friendId,
    status: "accepted",
  };
  libraries.clear();
  rankings.clear();
  comparisons.clear();
  seriesByAnimeId.clear();
  storedProfiles.clear();
  tasteProfiles.clear();
  generatedEmbeddings.clear();
  upsertCalls.length = 0;
  serverQueryCount = 0;

  libraries.set(
    viewerId,
    Array.from({ length: 5 }, (_, index) =>
      entry(`viewer-${index}`, "completed"),
    ),
  );
  libraries.set(
    friendId,
    Array.from({ length: 5 }, (_, index) =>
      entry(`friend-${index}`, "completed"),
    ),
  );
  comparisons.set(viewerId, [comparison(1), comparison(2), comparison(3)]);
  comparisons.set(friendId, [comparison(4), comparison(5), comparison(6)]);
  storedProfiles.set(viewerId, {
    embedding: [1, 0, 0],
    input_hash: `hash-${viewerId}`,
    embedding_model: "test-model",
  });
  storedProfiles.set(friendId, {
    embedding: JSON.stringify([0.8, 0.6, 0]),
    input_hash: `hash-${friendId}`,
    embedding_model: "test-model",
  });
});

describe("getTasteSimilarity", () => {
  it("rejects non-friends before reading taste data", async () => {
    friendship = null;
    assert.deepEqual(await getTasteSimilarity(viewerId, friendId), {
      status: "unavailable",
      reason: "not_friends",
    });
    assert.equal(serverQueryCount, 0);
  });

  it("reports disabled embeddings without reading taste data", async () => {
    embeddingConfigured = false;
    assert.deepEqual(await getTasteSimilarity(viewerId, friendId), {
      status: "unavailable",
      reason: "not_configured",
    });
    assert.equal(serverQueryCount, 0);
  });

  it("uses current cached embeddings and data richness for the score", async () => {
    assert.deepEqual(await getTasteSimilarity(viewerId, friendId), {
      status: "ready",
      score: 80,
      label: "Similar taste",
      confidence: "high",
    });
    assert.deepEqual(upsertCalls, []);
  });

  it("rebuilds stale embeddings and reports insufficient profiles", async () => {
    storedProfiles.get(viewerId)!.input_hash = "stale";
    generatedEmbeddings.set(viewerId, [1, 0, 0]);
    storedProfiles.delete(friendId);
    tasteProfiles.set(friendId, {
      ...profile(friendId),
      profileText: "",
      signals: { ...profile(friendId).signals, completedTitles: [] },
    });

    assert.deepEqual(await getTasteSimilarity(viewerId, friendId), {
      status: "unavailable",
      reason: "insufficient_data",
    });
    assert.deepEqual(upsertCalls, [viewerId]);
  });
});

describe("taste comparison profile", () => {
  it("builds ranking highlights from shared completed franchises", async () => {
    rankings.set(viewerId, [seriesRow("shared", 1), seriesRow("split", 8)]);
    rankings.set(friendId, [seriesRow("shared", 2), seriesRow("split", 3)]);
    libraries.set(viewerId, [entry("shared-anime", "completed")]);
    libraries.set(friendId, [entry("shared-anime", "completed")]);
    seriesByAnimeId.set("shared-anime", "shared");

    const highlights = await getTasteCompareHighlights(viewerId, friendId, 1);
    assert.equal(highlights.sharedCompletedSeriesCount, 1);
    assert.equal(highlights.sharedFavorites[0]?.seriesId, "shared");
    assert.equal(highlights.biggestDisagreements[0]?.seriesId, "split");
  });

  it("assembles similarity, differences, discovery, and watchlist data", async () => {
    const viewerEntries = [
      entry("shared-anime", "completed", { score: 9, genres: ["Drama"] }),
      entry("viewer-only", "completed", {
        score: 10,
        genres: ["Action"],
        format: "MOVIE",
      }),
      entry("shared-plan", "plan_to_watch", { priority: "low" }),
    ];
    const friendEntries = [
      entry("shared-anime", "completed", { score: 8, genres: ["Drama"] }),
      entry("friend-only", "completed", {
        score: 9,
        genres: ["Comedy"],
        format: "ONA",
      }),
      entry("shared-plan", "plan_to_watch", { priority: "high" }),
    ];
    libraries.set(viewerId, viewerEntries);
    libraries.set(friendId, friendEntries);
    rankings.set(viewerId, [seriesRow("shared", 1)]);
    rankings.set(friendId, [seriesRow("shared", 2)]);
    seriesByAnimeId.set("shared-anime", "shared");
    seriesByAnimeId.set("viewer-only", "viewer-series");
    seriesByAnimeId.set("friend-only", "friend-series");

    const result = await getTasteMatchProfile(viewerId, friendId);

    assert.equal(result.similarity.status, "ready");
    assert.equal(result.highlights.sharedCompletedSeriesCount, 1);
    assert.equal(result.sharedGenres[0]?.genre, "Drama");
    assert.deepEqual(
      result.formatDifferences.map(({ format, delta }) => ({ format, delta })),
      [
        { format: "MOVIE", delta: 1 },
        { format: "ONA", delta: -1 },
      ],
    );
    assert.equal(result.viewerLovedFriendUnwatched[0]?.animeId, "viewer-only");
    assert.equal(result.friendLovedViewerUnwatched[0]?.animeId, "friend-only");
    assert.equal(result.sharedPlanToWatch[0]?.animeId, "shared-plan");
  });

  it("returns an empty profile for non-friends", async () => {
    friendship = null;
    const result = await getTasteMatchProfile(viewerId, friendId);
    assert.equal(result.similarity.status, "unavailable");
    assert.deepEqual(result.highlights.sharedFavorites, []);
    assert.deepEqual(result.sharedGenres, []);
    assert.deepEqual(result.sharedPlanToWatch, []);
  });
});
