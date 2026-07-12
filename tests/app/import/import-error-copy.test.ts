import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { importFailureMessage } from "@/app/(app)/import/import-error-copy";

describe("importFailureMessage", () => {
  it("maps known failure codes to safe copy", () => {
    assert.match(importFailureMessage("source_unavailable"), /try again/i);
    assert.match(importFailureMessage("invalid_source"), /could not be read/i);
  });

  it("never renders legacy free-form errors", () => {
    const raw = "password=secret provider failure";
    const message = importFailureMessage(raw);
    assert.equal(message, "The import could not be completed. Please try again.");
    assert.doesNotMatch(message, /secret|provider/i);
  });
});
