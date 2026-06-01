import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { anilistSearchErrorMessage } from "./errors";

describe("anilistSearchErrorMessage", () => {
  it("maps 429 errors", () => {
    assert.match(
      anilistSearchErrorMessage(new Error("HTTP 429")),
      /busy/i,
    );
  });

  it("returns Error message", () => {
    assert.equal(anilistSearchErrorMessage(new Error("timeout")), "timeout");
  });

  it("returns generic message for unknown errors", () => {
    assert.match(anilistSearchErrorMessage("x"), /Could not reach/i);
  });
});
