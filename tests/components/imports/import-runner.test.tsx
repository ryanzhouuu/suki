import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ImportRunner as ImportRunnerType } from "@/components/imports/import-runner";
import type { ImportJobProgress } from "@/lib/imports/types";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

mock.module("@/actions/imports", {
  namedExports: {
    processImportChunk: async () => null,
  },
});

let ImportRunner: typeof ImportRunnerType;

before(async () => {
  ({ ImportRunner } = await import("@/components/imports/import-runner"));
});

function makeJob(overrides: Partial<ImportJobProgress> = {}): ImportJobProgress {
  return {
    id: "job-1",
    source: "mal_xml",
    status: "parsing",
    total: 10,
    processed: 0,
    matched: 0,
    needsReview: 0,
    unmatched: 0,
    imported: 0,
    skipped: 0,
    error: null,
    ...overrides,
  };
}

describe("ImportRunner", () => {
  afterEach(() => {
    cleanup();
    router.refresh = () => {};
  });

  it("renders progress for the given job", () => {
    render(<ImportRunner job={makeJob()} />);
    screen.getByText("Matching your titles…");
  });

  it("refreshes the router once the loop has no more automatic work", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<ImportRunner job={makeJob({ status: "needs_review" })} />);
    await waitFor(() => assert.equal(refreshed, true));
  });
});
