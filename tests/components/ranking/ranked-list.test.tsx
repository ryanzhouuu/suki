import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { RankedList as RankedListType } from "@/components/ranking/ranked-list";
import type { LibraryGroup } from "@/lib/library/group";
import type { Tables } from "@/types/database";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async () => ({}),
    removeAnimeEntry: async () => ({}),
  },
});
mock.module("@/actions/ranking", {
  namedExports: {
    resetSeriesRanking: async () => ({}),
  },
});

let RankedList: typeof RankedListType;

before(async () => {
  ({ RankedList } = await import("@/components/ranking/ranked-list"));
});

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

function row(overrides: Partial<RankedSeriesRow> & { rank: number }): RankedSeriesRow {
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

function makeGroup(): LibraryGroup {
  return {
    key: "series-1",
    series: { id: "series-1", canonical_title: "Series 1", cover_image_url: null, slug: "series-1" },
    entries: [],
    primaryStatus: "completed",
    statusCounts: { watching: 0, completed: 0, paused: 0, plan_to_watch: 0, dropped: 0 },
  };
}

describe("RankedList", () => {
  afterEach(() => {
    cleanup();
    router.refresh = () => {};
  });

  it("shows an empty-state message when there are no rankings", () => {
    render(<RankedList rankings={[]} />);
    screen.getByText(/Complete anime and compare series/);
  });

  it("shows each series title, rank, and confidence label", () => {
    render(
      <RankedList
        rankings={[row({ rank: 1 }), row({ rank: 2, confidence: "medium" })]}
      />,
    );
    screen.getByText("Series 1");
    screen.getByText("1");
    screen.getByText("Series 2");
    screen.getByText("Well established");
    screen.getByText("Getting clearer");
  });

  it("shows genres when provided for a series", () => {
    render(
      <RankedList
        rankings={[row({ rank: 1 })]}
        genresBySeriesId={{ "series-1": ["Action", "Adventure", "Comedy", "Drama"] }}
      />,
    );
    screen.getByText("Action · Adventure · Comedy");
  });

  it("shows neither Details nor Re-rank when not editable and no library group", () => {
    render(<RankedList rankings={[row({ rank: 1 })]} />);
    assert.equal(screen.queryByRole("button"), null);
  });

  it("shows a Re-rank button when editable", () => {
    render(<RankedList rankings={[row({ rank: 1 })]} editable />);
    screen.getByRole("button", { name: "Re-rank" });
  });

  it("opens the series details dialog from the Details button", () => {
    render(
      <RankedList
        rankings={[row({ rank: 1 })]}
        libraryGroupsBySeriesId={{ "series-1": makeGroup() }}
      />,
    );
    assert.equal(screen.queryByRole("dialog"), null);
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    screen.getByRole("dialog");
  });

  it("collapses to 10 rows with a 'Show all' toggle when collapsible", () => {
    const rankings = Array.from({ length: 12 }, (_, i) => row({ rank: i + 1 }));
    render(<RankedList rankings={rankings} collapsible />);
    assert.equal(screen.queryByText("Series 11"), null);
    fireEvent.click(screen.getByRole("button", { name: "Show all 12" }));
    screen.getByText("Series 11");
  });
});
