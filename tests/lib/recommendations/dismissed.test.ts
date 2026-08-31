import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

let rows: { anime_id: string | null }[] = [];
let queryError: Error | null = null;
let filters: [string, string, unknown][] = [];

mock.module("react", {
  namedExports: {
    cache: <T extends (...args: never[]) => unknown>(callback: T) => callback,
  },
});
mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => {
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters.push(["eq", column, value]);
          return query;
        },
        not: async (column: string, operator: string, value: unknown) => {
          filters.push([operator, column, value]);
          return { data: rows, error: queryError };
        },
      };
      return { from: () => query };
    },
  },
});

let getDismissedAnimeIds: typeof import("@/lib/recommendations/dismissed").getDismissedAnimeIds;

before(async () => {
  ({ getDismissedAnimeIds } = await import("@/lib/recommendations/dismissed"));
});

beforeEach(() => {
  rows = [];
  queryError = null;
  filters = [];
});

describe("getDismissedAnimeIds", () => {
  it("deduplicates dismissed anime IDs and applies the event filters", async () => {
    rows = [
      { anime_id: "anime-1" },
      { anime_id: "anime-1" },
      { anime_id: "anime-2" },
    ];

    assert.deepEqual(await getDismissedAnimeIds("viewer"), [
      "anime-1",
      "anime-2",
    ]);
    assert.deepEqual(filters, [
      ["eq", "user_id", "viewer"],
      ["eq", "event_type", "recommendation_dismissed"],
      ["is", "anime_id", null],
    ]);
  });

  it("returns an empty list when there is no dismissal history", async () => {
    assert.deepEqual(await getDismissedAnimeIds("viewer"), []);
  });

  it("propagates query failures", async () => {
    queryError = new Error("dismissal lookup failed");

    await assert.rejects(
      getDismissedAnimeIds("viewer"),
      /dismissal lookup failed/,
    );
  });
});
