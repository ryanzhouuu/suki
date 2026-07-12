import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyResilienceError,
  safeMessageFor,
} from "@/lib/resilience/errors";

describe("classifyResilienceError", () => {
  it("recognizes native aborts and timeouts for every dependency", () => {
    assert.deepEqual(
      classifyResilienceError("internal", { name: "AbortError" }),
      { kind: "timeout", retryable: true },
    );
    assert.deepEqual(
      classifyResilienceError("openai", { name: "APIConnectionTimeoutError" }),
      { kind: "timeout", retryable: true, providerCode: undefined },
    );
  });

  it("recognizes OpenAI rate limits, outages, and quota configuration failures", () => {
    assert.deepEqual(classifyResilienceError("openai", { status: 429 }), {
      kind: "rate_limited",
      retryable: true,
      providerStatus: 429,
      providerCode: undefined,
    });
    assert.deepEqual(
      classifyResilienceError("openai", {
        status: 429,
        code: "insufficient_quota",
      }),
      {
        kind: "configuration",
        retryable: false,
        providerStatus: 429,
        providerCode: "insufficient_quota",
      },
    );
    assert.deepEqual(
      classifyResilienceError("openai", { name: "APIConnectionError" }),
      { kind: "unavailable", retryable: true, providerCode: undefined },
    );
    assert.equal(
      classifyResilienceError("openai", new TypeError("bad application code")),
      null,
    );
  });

  it("recognizes stable Supabase/Postgres error codes", () => {
    assert.deepEqual(classifyResilienceError("supabase", { code: "08006" }), {
      kind: "unavailable",
      retryable: true,
      providerCode: "08006",
    });
    assert.deepEqual(classifyResilienceError("supabase", { code: "57014" }), {
      kind: "timeout",
      retryable: true,
      providerCode: "57014",
    });
    assert.deepEqual(classifyResilienceError("supabase", { code: "42501" }), {
      kind: "forbidden",
      retryable: false,
      providerCode: "42501",
    });
    assert.deepEqual(classifyResilienceError("supabase", { code: "PGRST301" }), {
      kind: "unauthorized",
      retryable: false,
      providerCode: "PGRST301",
    });
    assert.deepEqual(classifyResilienceError("supabase", { code: "PGRST116" }), {
      kind: "not_found",
      retryable: false,
      providerCode: "PGRST116",
    });
  });

  it("uses only the dependency supplied by the caller", () => {
    const anilist = new Error("AniList request failed: 503");
    assert.deepEqual(classifyResilienceError("anilist", anilist), {
      kind: "unavailable",
      retryable: true,
      providerStatus: 503,
      providerCode: undefined,
    });
    assert.equal(classifyResilienceError("supabase", anilist), null);
  });

  it("limits AniList message matching to adapter-owned formats", () => {
    assert.deepEqual(
      classifyResilienceError(
        "anilist",
        new Error("AniList rate limit exceeded (429). Wait a minute and try again."),
      ),
      { kind: "rate_limited", retryable: true, providerStatus: 429 },
    );
    assert.equal(
      classifyResilienceError("anilist", new Error("rate limit happened somehow")),
      null,
    );
  });

  it("recognizes exact environment configuration formats without matching arbitrary errors", () => {
    assert.deepEqual(
      classifyResilienceError(
        "openai",
        new Error("OPENAI_API_KEY is not set. Add it to .env.local."),
      ),
      { kind: "configuration", retryable: false },
    );
    assert.equal(
      classifyResilienceError("internal", new Error("Config looks wrong")),
      null,
    );
  });

  it("returns safe provider-neutral messages", () => {
    for (const kind of [
      "timeout",
      "rate_limited",
      "unavailable",
      "configuration",
      "unauthorized",
      "forbidden",
      "not_found",
      "invalid_request",
    ] as const) {
      const message = safeMessageFor(kind);
      assert.ok(message.length > 0);
      assert.doesNotMatch(message, /Supabase|AniList|OpenAI|API_KEY|\.env/i);
    }
  });
});
