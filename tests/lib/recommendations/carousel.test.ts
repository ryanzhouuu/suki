import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { nextIndexAfterDismiss } from "@/lib/recommendations/carousel";

describe("nextIndexAfterDismiss", () => {
  it("keeps the same index when dismissing a middle card", () => {
    assert.equal(nextIndexAfterDismiss(1, 4), 1);
  });

  it("steps back to the new last index when dismissing the last card", () => {
    assert.equal(nextIndexAfterDismiss(3, 4), 2);
  });

  it("returns zero when only one card was visible", () => {
    assert.equal(nextIndexAfterDismiss(0, 1), 0);
  });
});
