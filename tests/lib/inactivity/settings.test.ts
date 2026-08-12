import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseInactivityDays } from "@/lib/inactivity/settings";

describe("parseInactivityDays", () => {
  it("accepts whole days within the supported range", () => {
    assert.equal(parseInactivityDays("7"), 7);
    assert.equal(parseInactivityDays("30"), 30);
    assert.equal(parseInactivityDays("365"), 365);
  });

  it("rejects missing, fractional, and out-of-range values", () => {
    assert.equal(parseInactivityDays(null), null);
    assert.equal(parseInactivityDays("6"), null);
    assert.equal(parseInactivityDays("30.5"), null);
    assert.equal(parseInactivityDays("366"), null);
  });
});
