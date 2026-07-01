import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { ImportProgress } from "@/components/imports/import-progress";
import type { ImportJobProgress } from "@/lib/imports/types";

function makeJob(overrides: Partial<ImportJobProgress> = {}): ImportJobProgress {
  return {
    id: "job-1",
    source: "mal_xml",
    status: "parsing",
    total: 100,
    processed: 25,
    matched: 20,
    needsReview: 3,
    unmatched: 2,
    imported: 0,
    skipped: 0,
    error: null,
    ...overrides,
  };
}

describe("ImportProgress", () => {
  it("shows the status copy and processed/total counts", () => {
    render(<ImportProgress job={makeJob()} />);
    screen.getByText("Matching your titles…");
    screen.getByText("25/100");
    cleanup();
  });

  it("shows the matched/review/unmatched summary", () => {
    render(<ImportProgress job={makeJob()} />);
    screen.getByText("20 matched · 3 to review · 2 unmatched");
    cleanup();
  });

  it("appends imported and skipped counts when non-zero", () => {
    render(<ImportProgress job={makeJob({ imported: 5, skipped: 2 })} />);
    screen.getByText("20 matched · 3 to review · 2 unmatched · 5 added · 2 skipped");
    cleanup();
  });

  it("hides the total counter when total is 0", () => {
    render(<ImportProgress job={makeJob({ total: 0, processed: 0 })} />);
    assert.equal(screen.queryByText("0/0"), null);
    cleanup();
  });

  it("shows the error alert when the job has an error", () => {
    render(<ImportProgress job={makeJob({ status: "failed", error: "Boom" })} />);
    screen.getByRole("alert");
    screen.getByText("Boom");
    cleanup();
  });

  it("maps each status to its copy", () => {
    const statuses: Array<[ImportJobProgress["status"], string]> = [
      ["pending", "Getting ready…"],
      ["needs_review", "Ready for review"],
      ["importing", "Adding to your library…"],
      ["series_backfill", "Preparing your rankings…"],
      ["done", "Import complete"],
      ["failed", "Import failed"],
      ["canceled", "Import canceled"],
    ];
    for (const [status, copy] of statuses) {
      render(<ImportProgress job={makeJob({ status })} />);
      screen.getByText(copy);
      cleanup();
    }
  });
});
