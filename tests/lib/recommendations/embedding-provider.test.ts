import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  formatEmbeddingError,
  isEmbeddingConfigured,
} from "@/lib/recommendations/embedding-provider";

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
