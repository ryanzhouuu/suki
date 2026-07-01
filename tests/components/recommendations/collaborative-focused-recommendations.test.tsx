import { before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { CollaborativeFocusedRecommendations as CollaborativeFocusedRecommendationsType } from "@/components/recommendations/collaborative-focused-recommendations";
import type { RecommendationRow } from "@/lib/recommendations/types";

mock.module("@/actions/library", {
  namedExports: { addAnimeEntry: async () => ({}) },
});
mock.module("@/actions/recommendations", {
  namedExports: {
    logRecommendationAdded: async () => {},
    logRecommendationClicked: async () => {},
    dismissRecommendation: async () => {},
  },
});

let CollaborativeFocusedRecommendations: typeof CollaborativeFocusedRecommendationsType;

before(async () => {
  ({ CollaborativeFocusedRecommendations } = await import(
    "@/components/recommendations/collaborative-focused-recommendations"
  ));
});

function makeItem(): RecommendationRow {
  return {
    id: "1",
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
      average_score: null,
      genres: [],
    },
    explanation: "Because you both like shonen",
    libraryEntry: null,
    parsedExplanationDetails: undefined,
  } as unknown as RecommendationRow;
}

describe("CollaborativeFocusedRecommendations", () => {
  it("uses collaborative context and why labels", () => {
    render(<CollaborativeFocusedRecommendations items={[makeItem()]} />);
    screen.getByText("Shared recommendation 1 of 1");
    screen.getByText("Why this works for both of you");
    cleanup();
  });
});
