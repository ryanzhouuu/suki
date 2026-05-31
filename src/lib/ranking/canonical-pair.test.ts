import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canonicalPairIds, pairKey } from "./canonical-pair";

describe("canonicalPairIds", () => {
  it("orders ids lexicographically", () => {
    const a = "00000000-0000-4000-8000-000000000002";
    const b = "00000000-0000-4000-8000-000000000001";
    assert.deepEqual(canonicalPairIds(a, b), [b, a]);
  });

  it("produces stable pair keys", () => {
    const left = "00000000-0000-4000-8000-000000000001";
    const right = "00000000-0000-4000-8000-000000000002";
    assert.equal(pairKey(right, left), pairKey(left, right));
  });
});
