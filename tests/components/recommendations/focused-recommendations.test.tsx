import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FocusedRecommendations as FocusedRecommendationsType } from "@/components/recommendations/focused-recommendations";
import type { RecommendationRow } from "@/lib/recommendations/types";

mock.module("@/actions/library", {
  namedExports: {
    addAnimeEntry: async () => ({}),
  },
});

mock.module("@/actions/recommendations", {
  namedExports: {
    logRecommendationAdded: async () => {},
    logRecommendationClicked: async () => {},
    dismissRecommendation: async () => {},
  },
});

let FocusedRecommendations: typeof FocusedRecommendationsType;

before(async () => {
  ({ FocusedRecommendations } = await import(
    "@/components/recommendations/focused-recommendations"
  ));
});

function makeItem(id: string, title: string): RecommendationRow {
  return {
    id,
    anime: {
      id: `anime-${id}`,
      anilist_id: Number(id),
      english_title: title,
      romaji_title: title,
      cover_image_url: null,
      banner_image_url: null,
      format: "TV",
      season_year: 2020,
      episodes: 12,
      average_score: null,
      genres: [],
    },
    explanation: `Pick ${title}`,
    libraryEntry: null,
    parsedExplanationDetails: undefined,
  } as unknown as RecommendationRow;
}

describe("FocusedRecommendations", () => {
  afterEach(() => cleanup());

  it("shows the empty state when there are no items", () => {
    render(<FocusedRecommendations items={[]} />);
    screen.getByText("No picks left in this set");
  });

  it("shows the first pick and disables carousel arrows for a single item", () => {
    render(<FocusedRecommendations items={[makeItem("1", "Naruto")]} />);
    screen.getByText("Naruto");
    const nextButtons = screen.getAllByRole("button", { name: "Next recommendation" });
    for (const button of nextButtons) {
      assert.equal(button.hasAttribute("disabled"), true);
    }
  });

  it("does not show the 'Up next' strip for a single item", () => {
    render(<FocusedRecommendations items={[makeItem("1", "Naruto")]} />);
    assert.equal(screen.queryByText("Up next"), null);
  });

  it("cycles to the next/previous pick with multiple items", () => {
    render(
      <FocusedRecommendations
        items={[makeItem("1", "Naruto"), makeItem("2", "One Piece")]}
      />,
    );
    screen.getByText("Naruto");
    fireEvent.click(screen.getAllByRole("button", { name: "Next recommendation" })[0]);
    screen.getByText("One Piece");
    fireEvent.click(screen.getAllByRole("button", { name: "Previous recommendation" })[0]);
    screen.getByText("Naruto");
  });

  it("jumps to a pick via the 'Up next' thumbnail strip", () => {
    render(
      <FocusedRecommendations
        items={[makeItem("1", "Naruto"), makeItem("2", "One Piece")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go to One Piece" }));
    screen.getByText("Recommendation 2 of 2");
  });

  it("removes a pick after dismissing it and shows the next one", async () => {
    render(
      <FocusedRecommendations
        items={[makeItem("1", "Naruto"), makeItem("2", "One Piece")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));
    await waitFor(() => screen.getByText("One Piece"));
    assert.equal(screen.queryByText("Naruto"), null);
    // Only one item left, so the carousel collapses.
    assert.equal(screen.queryByText("Up next"), null);
  });

  it("shows the empty state once every pick has been dismissed", async () => {
    render(<FocusedRecommendations items={[makeItem("1", "Naruto")]} />);
    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));
    await waitFor(() => screen.getByText("No picks left in this set"));
  });
});
