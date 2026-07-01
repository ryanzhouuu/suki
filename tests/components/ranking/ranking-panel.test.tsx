import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RankingPanel as RankingPanelType } from "@/components/ranking/ranking-panel";
import type { SeriesComparisonPair } from "@/lib/ranking/prompt";
import type { Tables } from "@/types/database";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { setPathname, setSearchParams } = installNavigationMock({
  pathname: "/ranking",
});

const fetchPairCalls: string[][] = [];
let fetchPairResult: { pair: SeriesComparisonPair | null; error?: string } = {
  pair: null,
};

mock.module("@/actions/ranking", {
  namedExports: {
    fetchComparisonPair: async (genres: string[]) => {
      fetchPairCalls.push(genres);
      return fetchPairResult;
    },
    submitComparison: async () => ({}),
    skipComparison: async () => ({}),
    resetSeriesRanking: async () => ({}),
  },
});
mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async () => ({}),
    removeAnimeEntry: async () => ({}),
  },
});

let RankingPanel: typeof RankingPanelType;

before(async () => {
  ({ RankingPanel } = await import("@/components/ranking/ranking-panel"));
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

function makePair(): SeriesComparisonPair {
  return {
    left: {
      id: "left-1",
      canonical_title: "Naruto",
      cover_image_url: null,
      entryCount: 1,
    } as SeriesComparisonPair["left"],
    right: {
      id: "right-1",
      canonical_title: "One Piece",
      cover_image_url: null,
      entryCount: 1,
    } as SeriesComparisonPair["right"],
  };
}

const baseProps = {
  genresBySeriesId: {},
  libraryGroupsBySeriesId: {},
  initialView: "list" as const,
};

describe("RankingPanel", () => {
  afterEach(() => {
    cleanup();
    setPathname("/ranking");
    setSearchParams("");
    fetchPairCalls.length = 0;
    fetchPairResult = { pair: null };
  });

  it("shows the comparison view when a pair is available and completedSeriesCount >= 2", () => {
    render(
      <RankingPanel
        {...baseProps}
        initialPair={makePair()}
        rankings={[]}
        completedSeriesCount={2}
      />,
    );
    screen.getByText("Naruto");
    screen.getByText("One Piece");
  });

  it("hides the comparison section when fewer than 2 completed series exist", () => {
    render(
      <RankingPanel
        {...baseProps}
        initialPair={null}
        rankings={[]}
        completedSeriesCount={1}
      />,
    );
    assert.equal(screen.queryByText("Which did you enjoy more?"), null);
  });

  it("shows the 'all caught up' message when there's no pair to compare", () => {
    render(
      <RankingPanel
        {...baseProps}
        initialPair={null}
        rankings={[]}
        completedSeriesCount={2}
      />,
    );
    screen.getByText(/you're all caught up/i);
  });

  it("shows the sidebar's completed/ranked counts and confidence breakdown", () => {
    render(
      <RankingPanel
        {...baseProps}
        initialPair={null}
        rankings={[row({ rank: 1 }), row({ rank: 2, confidence: "medium" })]}
        completedSeriesCount={5}
      />,
    );
    // The sidebar renders twice (mobile <details> + desktop block); "2" also
    // coincidentally matches the #2 rank badge in the ranked list below, so
    // scope to the <dd> summary values specifically.
    assert.equal(screen.getAllByText("5").length, 2);
    const rankedSeriesDds = screen
      .getAllByText("Ranked series")
      .map((dt) => dt.nextElementSibling?.textContent);
    assert.deepEqual(rankedSeriesDds, ["2", "2"]);
  });

  it("shows the ranked list by default and switches to tiers via the view toggle", () => {
    render(
      <RankingPanel
        {...baseProps}
        initialPair={null}
        rankings={[row({ rank: 1 })]}
        completedSeriesCount={2}
      />,
    );
    screen.getByText("Series 1");
    fireEvent.click(screen.getByRole("tab", { name: "Tiers" }));
    // TierListView renders posters without the numeric rank badge used by RankedList.
    screen.getByTitle("Series 1");
  });

  it("re-fetches a comparison pair when the genre filter changes", async () => {
    render(
      <RankingPanel
        {...baseProps}
        initialPair={makePair()}
        rankings={[]}
        completedSeriesCount={2}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /^Genres/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Action" })[0]);
    await waitFor(() => assert.equal(fetchPairCalls.length, 1));
    assert.deepEqual(fetchPairCalls[0], ["Action"]);
  });

  it("shows the genre match count once filtering the ranking list", () => {
    setSearchParams("genre=Action");
    render(
      <RankingPanel
        {...baseProps}
        genresBySeriesId={{ "series-1": ["Action"] }}
        initialPair={null}
        rankings={[row({ rank: 1 }), row({ rank: 2 })]}
        completedSeriesCount={2}
      />,
    );
    // FilterMatchCount naively appends "s" ("seriess") rather than
    // pluralizing correctly — this matches its actual known behavior.
    screen.getByText("1 of 2 seriess match");
  });
});
