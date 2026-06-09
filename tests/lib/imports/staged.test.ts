import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyCorrections,
  dedupeStagedRows,
  toImportEntries,
} from "@/lib/imports/staged";
import type { StagedRow } from "@/lib/imports/types";

function row(overrides: Partial<StagedRow> & { rowId: string }): StagedRow {
  return {
    sourceTitle: "Title",
    matchState: "matched",
    anilistId: 1,
    media: null,
    status: "completed",
    personalScore: null,
    progressEpisodes: 0,
    skip: false,
    ...overrides,
  };
}

describe("dedupeStagedRows", () => {
  it("keeps only the first matched row per anilistId", () => {
    const rows = [
      row({ rowId: "a", anilistId: 21 }),
      row({ rowId: "b", anilistId: 21, status: "watching" }),
      row({ rowId: "c", anilistId: 5 }),
    ];
    const deduped = dedupeStagedRows(rows);
    assert.deepEqual(
      deduped.map((r) => r.rowId),
      ["a", "c"],
    );
  });

  it("keeps every unresolved row (null anilistId)", () => {
    const rows = [
      row({ rowId: "a", matchState: "unmatched", anilistId: null }),
      row({ rowId: "b", matchState: "needs_review", anilistId: null }),
    ];
    assert.equal(dedupeStagedRows(rows).length, 2);
  });
});

describe("applyCorrections", () => {
  it("applies skip, status, and score edits by rowId", () => {
    const rows = [row({ rowId: "a" }), row({ rowId: "b" })];
    const result = applyCorrections(rows, [
      { rowId: "a", skip: true },
      { rowId: "b", status: "dropped", personalScore: 6.5 },
    ]);
    assert.equal(result[0].skip, true);
    assert.equal(result[1].status, "dropped");
    assert.equal(result[1].personalScore, 6.5);
  });

  it("promotes a needs_review row to matched when given an anilistId", () => {
    const rows = [
      row({ rowId: "a", matchState: "needs_review", anilistId: null }),
    ];
    const result = applyCorrections(rows, [{ rowId: "a", anilistId: 121 }]);
    assert.equal(result[0].matchState, "matched");
    assert.equal(result[0].anilistId, 121);
  });

  it("ignores corrections for unknown rowIds", () => {
    const rows = [row({ rowId: "a" })];
    const result = applyCorrections(rows, [{ rowId: "zzz", skip: true }]);
    assert.equal(result[0].skip, false);
  });
});

describe("toImportEntries", () => {
  it("includes only matched, non-skipped rows with an anilistId", () => {
    const rows = [
      row({ rowId: "a", anilistId: 21, status: "completed", personalScore: 8 }),
      row({ rowId: "b", anilistId: 22, skip: true }),
      row({ rowId: "c", matchState: "unmatched", anilistId: null }),
      row({ rowId: "d", matchState: "needs_review", anilistId: null }),
    ];
    const entries = toImportEntries(rows);
    assert.deepEqual(entries, [
      { anilistId: 21, status: "completed", personalScore: 8, progressEpisodes: 0 },
    ]);
  });
});
