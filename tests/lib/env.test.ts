import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { env } from "@/lib/env";

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
});

describe("E2E provider endpoint overrides", () => {
  it("keeps production defaults when E2E mode is absent", () => {
    delete process.env.E2E_TEST_MODE;
    process.env.ANILIST_GRAPHQL_URL = "http://127.0.0.1:4100/anilist/graphql";
    process.env.OPENAI_BASE_URL = "http://127.0.0.1:4100/openai/v1";

    assert.equal(env.anilistGraphqlUrl(), "https://graphql.anilist.co");
    assert.equal(env.openAiBaseUrl(), undefined);
  });

  it("accepts loopback overrides in E2E mode", () => {
    process.env.E2E_TEST_MODE = "1";
    process.env.ANILIST_GRAPHQL_URL = "http://127.0.0.1:4100/anilist/graphql";
    process.env.OPENAI_BASE_URL = "http://localhost:4100/openai/v1";

    assert.equal(
      env.anilistGraphqlUrl(),
      "http://127.0.0.1:4100/anilist/graphql",
    );
    assert.equal(env.openAiBaseUrl(), "http://localhost:4100/openai/v1");
  });

  it("rejects hosted provider overrides in E2E mode", () => {
    process.env.E2E_TEST_MODE = "1";
    process.env.ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";
    assert.throws(() => env.anilistGraphqlUrl(), /loopback HTTP URL/);

    process.env.OPENAI_BASE_URL = "https://api.openai.com/v1";
    assert.throws(() => env.openAiBaseUrl(), /loopback HTTP URL/);
  });
});
