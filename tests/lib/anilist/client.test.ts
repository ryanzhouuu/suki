import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { anilistQuery as AnilistQuery } from "@/lib/anilist/client";

let token: string | null = null;

mock.module("@/lib/anilist/token", {
  namedExports: { getAnilistToken: () => token },
});

type FetchCall = { headers: Record<string, string> };
const fetchCalls: FetchCall[] = [];
let resolveFetch: (() => void) | null = null;

function installFetch(gate = false) {
  fetchCalls.length = 0;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    fetchCalls.push({ headers: init.headers as Record<string, string> });
    if (gate) {
      await new Promise<void>((resolve) => {
        resolveFetch = resolve;
      });
    }
    return {
      status: 200,
      ok: true,
      headers: { get: () => null },
      json: async () => ({ data: { ok: true } }),
    };
  }) as unknown as typeof fetch;
}

let anilistQuery: typeof AnilistQuery;

before(async () => {
  ({ anilistQuery } = await import("@/lib/anilist/client"));
});

describe("anilistQuery", () => {
  beforeEach(() => {
    token = null;
    resolveFetch = null;
  });

  it("coalesces identical concurrent calls into a single fetch", async () => {
    installFetch(true);
    const a = anilistQuery("query X", { id: 1 });
    const b = anilistQuery("query X", { id: 1 });
    // Both are in flight; only one underlying fetch should have been issued.
    await Promise.resolve();
    assert.equal(fetchCalls.length, 1);
    resolveFetch?.();
    await Promise.all([a, b]);
    assert.equal(fetchCalls.length, 1);

    // A fresh call after settlement fetches again.
    installFetch(false);
    await anilistQuery("query X", { id: 1 });
    assert.equal(fetchCalls.length, 1);
  });

  it("omits the Authorization header when no token is configured", async () => {
    installFetch(false);
    await anilistQuery("query NoToken", { id: 2 });
    assert.equal(fetchCalls[0].headers.Authorization, undefined);
  });

  it("attaches a Bearer token when one is configured", async () => {
    token = "secret-token";
    installFetch(false);
    await anilistQuery("query WithToken", { id: 3 });
    assert.equal(fetchCalls[0].headers.Authorization, "Bearer secret-token");
  });
});
