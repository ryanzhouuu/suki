import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolvedComparisonsFromRows } from "./preference-graph";

describe("resolvedComparisonsFromRows", () => {
  it("skips rows without a winner", () => {
    assert.deepEqual(
      resolvedComparisonsFromRows([
        {
          left_series_id: "a",
          right_series_id: "b",
          winner_series_id: null,
        },
      ]),
      [],
    );
  });

  it("resolves loser from left or right", () => {
    assert.deepEqual(
      resolvedComparisonsFromRows([
        {
          left_series_id: "a",
          right_series_id: "b",
          winner_series_id: "a",
        },
        {
          left_series_id: "c",
          right_series_id: "d",
          winner_series_id: "d",
        },
      ]),
      [
        { winnerId: "a", loserId: "b" },
        { winnerId: "d", loserId: "c" },
      ],
    );
  });
});
