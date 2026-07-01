import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FocusedRecommendationCard as FocusedRecommendationCardType } from "@/components/recommendations/focused-recommendation-card";
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

let FocusedRecommendationCard: typeof FocusedRecommendationCardType;

before(async () => {
  ({ FocusedRecommendationCard } = await import(
    "@/components/recommendations/focused-recommendation-card"
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
      banner_image_url: null,
      format: "TV",
      season_year: 2002,
      episodes: 220,
      average_score: 82,
      genres: ["Action", "Adventure"],
    },
    explanation: "Because you liked shonen action",
    libraryEntry: null,
    parsedExplanationDetails: undefined,
    ...overrides,
  } as unknown as RecommendationRow;
}

describe("FocusedRecommendationCard", () => {
  afterEach(() => {
    cleanup();
    addAnimeEntryCalls.length = 0;
    addedLogCalls.length = 0;
    clickedLogCalls.length = 0;
    dismissCalls.length = 0;
  });

  it("shows the position label, title, meta, genres, and explanation", () => {
    render(
      <FocusedRecommendationCard
        row={makeRow()}
        index={1}
        total={5}
        onDismissed={() => {}}
      />,
    );
    screen.getByText("Recommendation 2 of 5");
    screen.getByText("Naruto");
    screen.getByText("TV");
    screen.getByText("220 eps");
    screen.getByText("★ 82");
    screen.getByText("Action");
    screen.getByText("Because you liked shonen action");
  });

  it("uses the custom context and why labels when provided", () => {
    render(
      <FocusedRecommendationCard
        row={makeRow()}
        index={0}
        total={3}
        onDismissed={() => {}}
        contextLabel="Shared recommendation"
        whyLabel="Why this works for both of you"
      />,
    );
    screen.getByText("Shared recommendation 1 of 3");
    screen.getByText("Why this works for both of you");
  });

  it("shows badges and secondary signals from parsedExplanationDetails", () => {
    render(
      <FocusedRecommendationCard
        row={makeRow({
          parsedExplanationDetails: {
            primaryReason: "Top genre match",
            secondarySignals: ["Highly rated by similar viewers"],
            matchedGenres: ["Action"],
            badges: ["strong_match", "popular"],
          } as never,
        })}
        index={0}
        total={1}
        onDismissed={() => {}}
      />,
    );
    screen.getByText("Top genre match");
    screen.getByText("Strong match");
    screen.getByText("Popular");
    screen.getByText("Highly rated by similar viewers");
  });

  it("shows the in-library status badge once an entry exists", () => {
    render(
      <FocusedRecommendationCard
        row={makeRow({ libraryEntry: { status: "watching" } as never })}
        index={0}
        total={1}
        onDismissed={() => {}}
      />,
    );
    screen.getByText("In library: Watching");
  });

  it("adds the entry and shows the library status after 'Plan to watch'", async () => {
    render(
      <FocusedRecommendationCard
        row={makeRow()}
        index={0}
        total={1}
        onDismissed={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Plan to watch" }));
    await waitFor(() => screen.getByText("In library: Plan to watch"));
    assert.deepEqual(addAnimeEntryCalls[0], { anilistId: 20, status: "plan_to_watch" });
    assert.deepEqual(addedLogCalls[0], { animeId: "anime-1", status: "plan_to_watch" });
  });

  it("calls onDismissed and logs the dismissal on 'Not interested'", async () => {
    let dismissed = false;
    render(
      <FocusedRecommendationCard
        row={makeRow()}
        index={0}
        total={1}
        onDismissed={() => (dismissed = true)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Not interested" }));
    await waitFor(() => assert.equal(dismissed, true));
    assert.deepEqual(dismissCalls, ["anime-1"]);
  });

  it("logs a click when 'Open details' is followed", () => {
    render(
      <FocusedRecommendationCard
        row={makeRow()}
        index={0}
        total={1}
        onDismissed={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: /Open details/ }));
    assert.deepEqual(clickedLogCalls, ["anime-1"]);
  });
});
