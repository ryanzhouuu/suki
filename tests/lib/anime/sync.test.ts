import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { syncAnimeFromAnilist as SyncAnimeFromAnilist } from "@/lib/anime/sync";
import { AnimeNotFoundError } from "@/lib/anime/errors";

let existingRow: unknown = null;
let anilistImpl: () => Promise<unknown> = async () => ({ Media: null });

function makeAdmin() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: existingRow }),
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: async () => ({ data: { id: "row" }, error: null }),
        }),
      }),
    }),
  };
}

mock.module("@/lib/supabase/admin", {
  namedExports: { createAdminClient: () => makeAdmin() },
});
mock.module("@/lib/anilist/detail", {
  namedExports: { fetchAnimeDetail: () => anilistImpl() },
});
mock.module("@/lib/series/resolver", {
  namedExports: { ensureAnimeSeriesMapping: async () => undefined },
});
mock.module("@/lib/recommendations/sync-anime-embedding", {
  namedExports: { syncAnimeEmbedding: async () => undefined },
});

let syncAnimeFromAnilist: typeof SyncAnimeFromAnilist;

before(async () => {
  ({ syncAnimeFromAnilist } = await import("@/lib/anime/sync"));
});

describe("syncAnimeFromAnilist", () => {
  beforeEach(() => {
    existingRow = null;
    anilistImpl = async () => ({ Media: null });
  });

  it("throws AnimeNotFoundError when AniList Media is null", async () => {
    await assert.rejects(
      () => syncAnimeFromAnilist(187538),
      (err: unknown) => err instanceof AnimeNotFoundError,
    );
  });

  it("propagates a generic error (not converted to not-found) when the fetch throws", async () => {
    anilistImpl = async () => {
      throw new Error("AniList request failed: 503");
    };
    await assert.rejects(
      () => syncAnimeFromAnilist(187538),
      (err: unknown) =>
        err instanceof Error && !(err instanceof AnimeNotFoundError),
    );
  });
});
