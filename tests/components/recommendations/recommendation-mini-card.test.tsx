import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  RecommendationCard as RecommendationCardType,
  RecommendationMiniCard as RecommendationMiniCardType,
} from "@/components/recommendations/recommendation-mini-card";
import type { RecommendationRow } from "@/lib/recommendations/types";

const addAnimeEntryCalls: Array<{ anilistId: number; status: string }> = [];
const addedLogCalls: Array<{ animeId: string; status: string }> = [];
const clickedLogCalls: string[] = [];
const dismissCalls: string[] = [];

mock.module("@/actions/library", {
  namedExports: {
    addAnimeEntry: async (anilistId: number, status: string) => {
      addAnimeEntryCalls.push({ anilistId, status });
      return {};
    },
  },
});

mock.module("@/actions/recommendations", {
  namedExports: {
    logRecommendationAdded: async (animeId: string, status: string) => {
      addedLogCalls.push({ animeId, status });
    },
    logRecommendationClicked: async (animeId: string) => {
      clickedLogCalls.push(animeId);
    },
    dismissRecommendation: async (animeId: string) => {
      dismissCalls.push(animeId);
    },
  },
});

let RecommendationMiniCard: typeof RecommendationMiniCardType;
let RecommendationCard: typeof RecommendationCardType;

before(async () => {
  ({ RecommendationMiniCard, RecommendationCard } = await import(
    "@/components/recommendations/recommendation-mini-card"
  ));
});

function makeRow(overrides: Partial<RecommendationRow> = {}): RecommendationRow {
  return {
    anime: {
      id: "anime-1",
      anilist_id: 20,
      english_title: "Naruto",
      romaji_title: "NARUTO",
      cover_image_url: null,
    },
    explanation: "Because you liked shonen action",
    parsedExplanationDetails: undefined,
    ...overrides,
  } as unknown as RecommendationRow;
}

describe("RecommendationMiniCard", () => {
  afterEach(() => {
    cleanup();
    addAnimeEntryCalls.length = 0;
    addedLogCalls.length = 0;
    clickedLogCalls.length = 0;
    dismissCalls.length = 0;
  });

  it("shows the title and explanation", () => {
    render(<RecommendationMiniCard row={makeRow()} />);
    screen.getByText("Naruto");
    screen.getByText("Because you liked shonen action");
  });

  it("prefers parsedExplanationDetails.primaryReason over the raw explanation", () => {
    render(
      <RecommendationMiniCard
        row={makeRow({
          parsedExplanationDetails: { primaryReason: "Top genre match" } as never,
        })}
      />,
    );
    screen.getByText("Top genre match");
    assert.equal(screen.queryByText("Because you liked shonen action"), null);
  });

  it("logs a click when the poster/title link is followed", () => {
    render(<RecommendationMiniCard row={makeRow()} />);
    fireEvent.click(screen.getByRole("link", { name: "Naruto" }));
    assert.deepEqual(clickedLogCalls, ["anime-1"]);
  });

  it("adds the entry as plan-to-watch and logs it", async () => {
    render(<RecommendationMiniCard row={makeRow()} />);
    fireEvent.click(screen.getByRole("button", { name: "Plan" }));
    await waitFor(() => assert.equal(addAnimeEntryCalls.length, 1));
    assert.deepEqual(addAnimeEntryCalls[0], { anilistId: 20, status: "plan_to_watch" });
    assert.deepEqual(addedLogCalls, [{ animeId: "anime-1", status: "plan_to_watch" }]);
  });

  it("adds the entry as watching and logs it", async () => {
    render(<RecommendationMiniCard row={makeRow()} />);
    fireEvent.click(screen.getByRole("button", { name: "Watching" }));
    await waitFor(() => assert.equal(addAnimeEntryCalls.length, 1));
    assert.deepEqual(addAnimeEntryCalls[0], { anilistId: 20, status: "watching" });
  });

  it("dismisses the card (hiding it) and logs the dismissal", async () => {
    render(<RecommendationMiniCard row={makeRow()} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    assert.equal(screen.queryByText("Naruto"), null);
    await waitFor(() => assert.deepEqual(dismissCalls, ["anime-1"]));
  });

  it("exports RecommendationCard as an alias of RecommendationMiniCard", () => {
    assert.equal(RecommendationCard, RecommendationMiniCard);
  });
});
