import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeUsername, validateUsername } from "@/lib/profiles/validate";

describe("validateUsername", () => {
  it("accepts valid usernames", () => {
    assert.equal(validateUsername("ryan_zhou"), null);
    assert.equal(validateUsername("abc"), null);
  });

  it("rejects too short or invalid characters", () => {
    assert.match(validateUsername("ab") ?? "", /3–30/);
    assert.match(validateUsername("bad-name") ?? "", /3–30/);
  });

  it("rejects reserved names", () => {
    assert.match(validateUsername("admin") ?? "", /reserved/i);
    assert.match(validateUsername("FRIENDS") ?? "", /reserved/i);
  });
});

describe("normalizeUsername", () => {
  it("trims whitespace", () => {
    assert.equal(normalizeUsername("  foo  "), "foo");
  });
});
