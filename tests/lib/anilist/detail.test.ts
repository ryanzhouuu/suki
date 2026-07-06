import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { fetchAnimeDetailUncached as FetchAnimeDetailUncached } from "@/lib/anilist/detail";

const calls: Array<{
  query: string;
  variables: unknown;
  options: unknown;
}> = [];

mock.module("@/lib/anilist/client", {
  namedExports: {
    anilistQuery: async (
      query: string,
      variables: unknown,
      options: unknown,
    ) => {
      calls.push({ query, variables, options });
      return { Media: { id: 42 } };
    },
  },
});

let fetchAnimeDetailUncached: typeof FetchAnimeDetailUncached;

before(async () => {
  ({ fetchAnimeDetailUncached } = await import("@/lib/anilist/detail"));
});

describe("fetchAnimeDetailUncached", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("queries AniList by id with cache disabled (the cache layer owns caching)", async () => {
    const result = await fetchAnimeDetailUncached(42);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].variables, { id: 42 });
    assert.deepEqual(calls[0].options, { cache: "no-store" });
    assert.deepEqual(result, { Media: { id: 42 } });
  });
});
