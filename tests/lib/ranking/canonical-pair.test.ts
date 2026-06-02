import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canonicalPairIds, pairKey } from "@/lib/ranking/canonical-pair";

describe("canonicalPairIds", () => {
  it("orders ids lexicographically", () => {
    assert.deepEqual(canonicalPairIds("b", "a"), ["a", "b"]);
    assert.deepEqual(canonicalPairIds("a", "b"), ["a", "b"]);
  });

  it("produces stable pair keys", () => {
    assert.equal(pairKey("x", "y"), pairKey("y", "x"));
  });
});

describe("pairKey", () => {
  it("matches canonicalPairIds order", () => {
    const [left, right] = canonicalPairIds("b-id", "a-id");
    assert.equal(pairKey("b-id", "a-id"), `${left}:${right}`);
    assert.equal(pairKey("a-id", "b-id"), `${left}:${right}`);
  });
});
