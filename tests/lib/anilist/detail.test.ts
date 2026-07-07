import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import { AnimeNotFoundError } from "@/lib/anime/errors";
import type {
  fetchAnimeDetail as FetchAnimeDetail,
  fetchAnimeDetailUncached as FetchAnimeDetailUncached,
} from "@/lib/anilist/detail";

const calls: Array<{
  query: string;
  variables: unknown;
  options: unknown;
}> = [];
const responses: unknown[] = [];
const cachedValues = new Map<string, unknown>();

mock.module("@/lib/anilist/cache", {
  namedExports: {
    ANILIST_CACHE_TAG: "anilist",
    ANILIST_CACHE_TTL_SECONDS: 1800,
    cachedAnilistFetch:
      <A extends unknown[], T>(
        keyParts: string[],
        fn: (...args: A) => Promise<T>,
      ) =>
      async (...args: A): Promise<T> => {
        const key = `${keyParts.join(":")}::${JSON.stringify(args)}`;
        if (cachedValues.has(key)) {
          return cachedValues.get(key) as T;
        }

        const value = await fn(...args);
        cachedValues.set(key, value);
        return value;
      },
  },
});

mock.module("@/lib/anilist/client", {
  namedExports: {
    anilistQuery: async (
      query: string,
      variables: unknown,
      options: unknown,
    ) => {
      calls.push({ query, variables, options });
      return responses.shift() ?? { Media: { id: 42 } };
    },
  },
});

let fetchAnimeDetailUncached: typeof FetchAnimeDetailUncached;
let fetchAnimeDetail: typeof FetchAnimeDetail;

before(async () => {
  ({ fetchAnimeDetail, fetchAnimeDetailUncached } = await import(
    "@/lib/anilist/detail"
  ));
});

describe("fetchAnimeDetailUncached", () => {
  beforeEach(() => {
    calls.length = 0;
    responses.length = 0;
    cachedValues.clear();
  });

  it("queries AniList by id with cache disabled (the cache layer owns caching)", async () => {
    const result = await fetchAnimeDetailUncached(42);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].variables, { id: 42 });
    assert.deepEqual(calls[0].options, { cache: "no-store" });
    assert.deepEqual(result, { Media: { id: 42 } });
  });
});

describe("fetchAnimeDetail", () => {
  beforeEach(() => {
    calls.length = 0;
    responses.length = 0;
    cachedValues.clear();
  });

  it("does not cache AniList null Media responses", async () => {
    responses.push({ Media: null }, { Media: { id: 187538 } });

    await assert.rejects(
      () => fetchAnimeDetail(187538),
      (err: unknown) => err instanceof AnimeNotFoundError,
    );

    const result = await fetchAnimeDetail(187538);

    assert.equal(calls.length, 2);
    assert.deepEqual(result, { Media: { id: 187538 } });
  });

  it("still caches successful AniList detail responses", async () => {
    responses.push({ Media: { id: 187538 } });

    const first = await fetchAnimeDetail(187538);
    const second = await fetchAnimeDetail(187538);

    assert.equal(calls.length, 1);
    assert.equal(first, second);
  });
});
