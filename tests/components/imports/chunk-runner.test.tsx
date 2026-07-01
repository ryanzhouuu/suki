import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ChunkRunner as ChunkRunnerType } from "@/components/imports/chunk-runner";
import type { ImportJobProgress } from "@/lib/imports/types";

const chunkCalls: string[] = [];
let chunkQueue: ImportJobProgress[] = [];

mock.module("@/actions/imports", {
  namedExports: {
    processImportChunk: async (jobId: string) => {
      chunkCalls.push(jobId);
      return chunkQueue.shift() ?? null;
    },
  },
});

let ChunkRunner: typeof ChunkRunnerType;

before(async () => {
  ({ ChunkRunner } = await import("@/components/imports/chunk-runner"));
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

describe("ChunkRunner", () => {
  afterEach(() => {
    cleanup();
    chunkCalls.length = 0;
    chunkQueue = [];
  });

  it("calls onStop immediately for a job with no pending work", async () => {
    let stopped: ImportJobProgress | null = null;
    render(
      <ChunkRunner
        initialJob={makeJob({ status: "needs_review" })}
        onStop={(job) => (stopped = job)}
      />,
    );
    await waitFor(() => assert.ok(stopped));
    assert.equal(chunkCalls.length, 0);
  });

  it("chains chunk processing until reaching a non-pending status", async () => {
    chunkQueue = [
      makeJob({ status: "parsing", processed: 5 }),
      makeJob({ status: "needs_review", processed: 10 }),
    ];
    let stopped: ImportJobProgress | null = null;
    render(
      <ChunkRunner
        initialJob={makeJob({ status: "parsing", processed: 0 })}
        onStop={(job) => (stopped = job)}
      />,
    );
    await waitFor(() => assert.ok(stopped));
    assert.equal(chunkCalls.length, 2);
    screen.getByText("Ready for review");
  });

  it("stops the loop (without calling onStop again) once a null chunk result arrives", async () => {
    chunkQueue = [];
    render(<ChunkRunner initialJob={makeJob({ status: "parsing" })} />);
    await waitFor(() => assert.equal(chunkCalls.length, 1));
    // Give any further ticks a chance to run; there should be no more.
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(chunkCalls.length, 1);
  });
});
