import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hashText } from "./hash";

describe("hashText", () => {
  it("returns stable sha256 hex", () => {
    const a = hashText("hello");
    const b = hashText("hello");
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it("differs for different input", () => {
    assert.notEqual(hashText("a"), hashText("b"));
  });
});
