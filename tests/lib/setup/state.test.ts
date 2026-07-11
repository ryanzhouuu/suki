import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ImportJobStatus } from "@/lib/imports/types";
import { resolveLibrarySetupView } from "@/lib/setup/state";

describe("resolveLibrarySetupView", () => {
  it("returns success when library count meets the threshold", () => {
    assert.equal(resolveLibrarySetupView(5, null), "success");
    assert.equal(resolveLibrarySetupView(12, "parsing"), "success");
  });

  it("returns active_import for in-progress job statuses", () => {
    const active: ImportJobStatus[] = [
      "pending",
      "parsing",
      "importing",
      "series_backfill",
      "needs_review",
    ];
    for (const status of active) {
      assert.equal(resolveLibrarySetupView(0, status), "active_import");
      assert.equal(resolveLibrarySetupView(3, status), "active_import");
    }
  });

  it("returns failed_import for failed or canceled jobs below threshold", () => {
    assert.equal(resolveLibrarySetupView(0, "failed"), "failed_import");
    assert.equal(resolveLibrarySetupView(2, "canceled"), "failed_import");
  });

  it("returns empty when there is no job and the library is below threshold", () => {
    assert.equal(resolveLibrarySetupView(0, null), "empty");
    assert.equal(resolveLibrarySetupView(4, "done"), "empty");
  });
});
