import assert from "node:assert/strict";
import { before, describe, it, mock } from "node:test";

// `@/lib/series/consolidate` imports `createAdminClient` from
// `@/lib/supabase/admin`, which is guarded by `import "server-only"` and
// throws outside a react-server module context. Stub the marker package
// before dynamically importing the module under test.
mock.module("server-only", { namedExports: {} });

let remapComparisonRow: typeof import("@/lib/series/consolidate").remapComparisonRow;

before(async () => {
  ({ remapComparisonRow } = await import("@/lib/series/consolidate"));
});

describe("remapComparisonRow", () => {
  const base = {
    id: "1",
    user_id: "u1",
    left_series_id: "a",
    right_series_id: "b",
    winner_series_id: "a",
    skipped_reason: null,
    created_at: "2026-01-01T00:00:00Z",
  };

  it("remaps winner and sides when merging into target", () => {
    const remapped = remapComparisonRow(
      {
        ...base,
        left_series_id: "aaa",
        right_series_id: "ccc",
        winner_series_id: "aaa",
      },
      "aaa",
      "bbb",
    );
    assert.ok(remapped);
    assert.equal(remapped.left_series_id, "bbb");
    assert.equal(remapped.right_series_id, "ccc");
    assert.equal(remapped.winner_series_id, "bbb");
  });

  it("drops self-pair comparisons", () => {
    const remapped = remapComparisonRow(
      { ...base, left_series_id: "aaa", right_series_id: "zzz" },
      "aaa",
      "zzz",
    );
    assert.equal(remapped, null);
  });
});
