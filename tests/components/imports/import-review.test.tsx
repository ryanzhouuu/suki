import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImportReview as ImportReviewType } from "@/components/imports/import-review";
import type {
  ImportJobProgress,
  StagedRow,
  StagedRowCorrection,
} from "@/lib/imports/types";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const confirmCalls: Array<{ jobId: string; corrections: StagedRowCorrection[] }> = [];
const cancelCalls: string[] = [];
let confirmResult: { error?: string } = {};

mock.module("@/actions/imports", {
  namedExports: {
    confirmImport: async (jobId: string, corrections: StagedRowCorrection[]) => {
      confirmCalls.push({ jobId, corrections });
      return confirmResult;
    },
    cancelImport: async (jobId: string) => {
      cancelCalls.push(jobId);
    },
  },
});

let ImportReview: typeof ImportReviewType;

before(async () => {
  ({ ImportReview } = await import("@/components/imports/import-review"));
});

function makeJob(overrides: Partial<ImportJobProgress> = {}): ImportJobProgress {
  return {
    id: "job-1",
    source: "mal_xml",
    status: "needs_review",
    total: 3,
    processed: 3,
    matched: 1,
    needsReview: 1,
    unmatched: 1,
    imported: 0,
    skipped: 0,
    error: null,
    ...overrides,
  };
}

function makeRow(overrides: Partial<StagedRow> = {}): StagedRow {
  return {
    rowId: "row-1",
    sourceTitle: "Naruto",
    matchState: "matched",
    anilistId: 20,
    media: null,
    status: "completed",
    personalScore: null,
    progressEpisodes: 0,
    ...overrides,
  } as unknown as StagedRow;
}

describe("ImportReview", () => {
  afterEach(() => {
    cleanup();
    confirmCalls.length = 0;
    cancelCalls.length = 0;
    confirmResult = {};
    router.refresh = () => {};
  });

  it("shows a summary of matched/needs-review/unmatched counts", () => {
    render(
      <ImportReview
        job={makeJob()}
        stagedRows={[
          makeRow({ rowId: "1", matchState: "matched" }),
          makeRow({ rowId: "2", matchState: "needs_review" }),
          makeRow({ rowId: "3", matchState: "unmatched" }),
        ]}
      />,
    );
    screen.getByText(/1 matched · 1 need review · 1 couldn't be matched/);
  });

  it("lets you choose a candidate for a needs-review row", async () => {
    render(
      <ImportReview
        job={makeJob()}
        stagedRows={[
          makeRow({
            rowId: "1",
            matchState: "needs_review",
            anilistId: null,
            candidates: [
              { anilistId: 20, title: "Naruto", coverImageUrl: null },
              { anilistId: 21, title: "Naruto: Shippuden", coverImageUrl: null },
            ],
          } as Partial<StagedRow>),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Naruto: Shippuden" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));

    await waitFor(() => assert.equal(confirmCalls.length, 1));
    assert.deepEqual(confirmCalls[0], {
      jobId: "job-1",
      corrections: [{ rowId: "1", skip: false, status: undefined, anilistId: 21 }],
    });
  });

  it("marks a needs-review row as Skip", async () => {
    render(
      <ImportReview
        job={makeJob()}
        stagedRows={[
          makeRow({ rowId: "1", matchState: "needs_review", candidates: [] } as Partial<StagedRow>),
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));

    await waitFor(() => assert.equal(confirmCalls.length, 1));
    assert.deepEqual(confirmCalls[0].corrections, [
      { rowId: "1", skip: true, status: undefined, anilistId: null },
    ]);
  });

  it("toggles a matched row between Skip and Include", () => {
    render(
      <ImportReview
        job={makeJob()}
        stagedRows={[makeRow({ rowId: "1", matchState: "matched" })]}
      />,
    );
    fireEvent.click(screen.getByText("1 matched titles"));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    screen.getByRole("button", { name: "Include" });
  });

  it("changes a matched row's status via the select", () => {
    render(
      <ImportReview
        job={makeJob()}
        stagedRows={[makeRow({ rowId: "1", matchState: "matched", status: "watching" })]}
      />,
    );
    fireEvent.click(screen.getByText("1 matched titles"));
    fireEvent.change(screen.getByDisplayValue("Watching"), {
      target: { value: "completed" },
    });
    screen.getByDisplayValue("Completed");
  });

  it("lists unmatched rows as skipped", () => {
    render(
      <ImportReview
        job={makeJob()}
        stagedRows={[makeRow({ rowId: "1", matchState: "unmatched", sourceTitle: "Obscure Show" })]}
      />,
    );
    fireEvent.click(screen.getByText("1 couldn't be matched (skipped)"));
    screen.getByText("Obscure Show");
  });

  it("shows an error instead of refreshing when confirm fails", async () => {
    confirmResult = { error: "Could not confirm" };
    render(
      <ImportReview job={makeJob()} stagedRows={[makeRow({ rowId: "1" })]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));
    await screen.findByRole("alert");
    screen.getByText("Could not confirm");
  });

  it("refreshes the router after a successful confirm", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(
      <ImportReview job={makeJob()} stagedRows={[makeRow({ rowId: "1" })]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm import" }));
    await waitFor(() => assert.equal(refreshed, true));
  });

  it("cancels the import and refreshes the router", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(
      <ImportReview job={makeJob()} stagedRows={[makeRow({ rowId: "1" })]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(cancelCalls, ["job-1"]);
  });
});
