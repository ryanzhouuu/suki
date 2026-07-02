import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

// `@/lib/recommendations/embedding-provider` imports `env` from
// `@/lib/env`, which is guarded by `import "server-only"` and throws
// outside a react-server module context. Stub the marker package before
// dynamically importing the module under test.
mock.module("server-only", { namedExports: {} });

let formatEmbeddingError: typeof import("@/lib/recommendations/embedding-provider").formatEmbeddingError;
let isEmbeddingConfigured: typeof import("@/lib/recommendations/embedding-provider").isEmbeddingConfigured;

before(async () => {
  ({ formatEmbeddingError, isEmbeddingConfigured } = await import(
    "@/lib/recommendations/embedding-provider"
  ));
});

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
});

describe("formatEmbeddingError", () => {
  it("formats quota errors", () => {
    assert.match(
      formatEmbeddingError({ status: 429, code: "insufficient_quota" }),
      /insufficient_quota/i,
    );
  });

  it("returns Error message", () => {
    assert.equal(formatEmbeddingError(new Error("boom")), "boom");
  });

  it("returns generic fallback", () => {
    assert.equal(formatEmbeddingError(null), "Embedding request failed");
  });
});

describe("isEmbeddingConfigured", () => {
  it("reflects OPENAI_API_KEY presence", () => {
    delete process.env.OPENAI_API_KEY;
    assert.equal(isEmbeddingConfigured(), false);
    process.env.OPENAI_API_KEY = "sk-test";
    assert.equal(isEmbeddingConfigured(), true);
  });
});
