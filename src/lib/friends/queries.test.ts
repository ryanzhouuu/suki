import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { escapeIlikePattern } from "./queries";

describe("escapeIlikePattern", () => {
  it("escapes ilike wildcards and backslash", () => {
    assert.equal(escapeIlikePattern("100%"), "100\\%");
    assert.equal(escapeIlikePattern("a_b"), "a\\_b");
    assert.equal(escapeIlikePattern("path\\x"), "path\\\\x");
  });

  it("leaves plain text unchanged", () => {
    assert.equal(escapeIlikePattern("naruto"), "naruto");
  });
});
