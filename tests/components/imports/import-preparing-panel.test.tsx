import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ImportPreparingPanel as ImportPreparingPanelType } from "@/components/imports/import-preparing-panel";
import type { ImportJobProgress } from "@/lib/imports/types";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

mock.module("@/actions/imports", {
  namedExports: {
    processImportChunk: async () => null,
  },
});

let ImportPreparingPanel: typeof ImportPreparingPanelType;

before(async () => {
  ({ ImportPreparingPanel } = await import(
    "@/components/imports/import-preparing-panel"
  ));
});

function makeJob(overrides: Partial<ImportJobProgress> = {}): ImportJobProgress {
  return {
    id: "job-1",
    source: "mal_xml",
    status: "series_backfill",
    total: 10,
    processed: 5,
    matched: 5,
    needsReview: 0,
    unmatched: 0,
    imported: 5,
    skipped: 0,
    error: null,
    ...overrides,
  };
}

describe("ImportPreparingPanel", () => {
  afterEach(() => {
    cleanup();
    router.refresh = () => {};
  });

  it("shows the preparing copy and the job's progress", () => {
    render(<ImportPreparingPanel job={makeJob()} />);
    // The panel's static heading and the series_backfill status label happen
    // to share this text.
    assert.equal(screen.getAllByText("Preparing your rankings…").length, 2);
    screen.getByText("5/10");
  });

  it("refreshes the router once the backfill's automatic work stops", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<ImportPreparingPanel job={makeJob({ status: "done" })} />);
    await waitFor(() => assert.equal(refreshed, true));
  });
});
