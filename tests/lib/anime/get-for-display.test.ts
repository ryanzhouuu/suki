import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { getAnimeForDisplay as GetAnimeForDisplay } from "@/lib/anime/get-for-display";
import { AnimeNotFoundError } from "@/lib/anime/errors";

// Configurable behaviour for the mocked dependencies, reset per test.
let cachedRow: unknown = null;
let authUser: unknown = null;
let anilistImpl: () => Promise<unknown> = async () => ({ Media: null });

function makeSupabase() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: cachedRow }),
        }),
      }),
    }),
  };
}

mock.module("@/lib/supabase/server", {
  namedExports: { createClient: async () => makeSupabase() },
});
mock.module("@/lib/auth/session", {
  namedExports: { getAuthUser: async () => authUser },
});
mock.module("@/lib/anilist/detail", {
  namedExports: { fetchAnimeDetail: () => anilistImpl() },
});
mock.module("@/lib/anime/sync", {
  namedExports: { syncAnimeFromAnilist: async () => ({ id: "synced" }) },
});

let getAnimeForDisplay: typeof GetAnimeForDisplay;

before(async () => {
  ({ getAnimeForDisplay } = await import("@/lib/anime/get-for-display"));
});

describe("getAnimeForDisplay", () => {
  beforeEach(() => {
    cachedRow = null;
    authUser = null;
    anilistImpl = async () => ({ Media: null });
  });

  it("throws AnimeNotFoundError when AniList Media is null", async () => {
    await assert.rejects(
      () => getAnimeForDisplay(210031),
      (err: unknown) => err instanceof AnimeNotFoundError,
    );
  });

  it("propagates a generic error (not converted to not-found) when the fetch throws", async () => {
    anilistImpl = async () => {
      throw new Error("AniList rate limit exceeded (429). Wait a minute and try again.");
    };
    await assert.rejects(
      () => getAnimeForDisplay(210031),
      (err: unknown) =>
        err instanceof Error && !(err instanceof AnimeNotFoundError),
    );
  });
});
