import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSearchApiUrl } from "@/lib/search/api-url";

describe("buildSearchApiUrl", () => {
  it("returns base path when empty", () => {
    assert.equal(buildSearchApiUrl("", []), "/api/search");
  });

  it("includes query and genres", () => {
    const url = buildSearchApiUrl("  naruto  ", ["Action", "Adventure"]);
    assert.ok(url.startsWith("/api/search?"));
    const params = new URLSearchParams(url.split("?")[1]);
    assert.equal(params.get("q"), "naruto");
    assert.deepEqual(params.getAll("genre"), ["Action", "Adventure"]);
  });
});
