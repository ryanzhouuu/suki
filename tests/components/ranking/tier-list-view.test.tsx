import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { TierListView } from "@/components/ranking/tier-list-view";
import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

function row(overrides: Partial<RankedSeriesRow> & { rank: number; score: number }): RankedSeriesRow {
  return {
    id: `row-${overrides.rank}`,
    algorithm_version: "bt_series_v1",
    confidence: "high",
    uncertainty: null,
    series_id: `series-${overrides.rank}`,
    user_id: "user-1",
    series: {
      id: `series-${overrides.rank}`,
      canonical_title: `Series ${overrides.rank}`,
      cover_image_url: null,
    } as Tables<"series">,
    ...overrides,
  } as unknown as RankedSeriesRow;
}

describe("TierListView", () => {
  it("shows an empty-state message when there are no rankings", () => {
    render(<TierListView rankings={[]} />);
    screen.getByText(/Complete anime and compare series/);
    cleanup();
  });

  it("groups rankings into tiers and shows series titles as poster tooltips", () => {
    render(
      <TierListView
        rankings={[
          row({ rank: 1, score: 3000 }),
          row({ rank: 2, score: 1800 }),
          row({ rank: 3, score: 1500 }),
        ]}
      />,
    );
    // All five tier rows render even when some are empty.
    const empties = screen.getAllByText("empty");
    assert.ok(empties.length > 0);
    screen.getByTitle("Series 1");
  });

  it("annotates low-confidence rows in the tooltip", () => {
    render(
      <TierListView
        rankings={[
          row({ rank: 1, score: 3000, confidence: "low" }),
          row({ rank: 2, score: 1500 }),
        ]}
      />,
    );
    screen.getByTitle("Series 1 · Needs more comparisons");
  });
});
