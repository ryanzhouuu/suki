import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { RecommendationsPreview as RecommendationsPreviewType } from "@/components/home/recommendations-preview";
import type { RecommendationRow } from "@/lib/recommendations/types";

let embeddingConfigured = true;
let recommendations: RecommendationRow[] = [];

mock.module("@/lib/recommendations/embedding-provider", {
  namedExports: {
    isEmbeddingConfigured: () => embeddingConfigured,
  },
});
mock.module("@/lib/recommendations/queries", {
  namedExports: {
    getUserRecommendations: async () => recommendations,
  },
});

let RecommendationsPreview: typeof RecommendationsPreviewType;

before(async () => {
  ({ RecommendationsPreview } = await import(
    "@/components/home/recommendations-preview"
  ));
});

function makeRow(id: string, title: string): RecommendationRow {
  return {
    id,
    anime: {
      anilist_id: 20,
      english_title: title,
      romaji_title: title,
      cover_image_url: null,
    },
    explanation: `Because you liked shonen`,
    parsedExplanationDetails: undefined,
  } as unknown as RecommendationRow;
}

describe("RecommendationsPreview", () => {
  afterEach(() => {
    cleanup();
    embeddingConfigured = true;
    recommendations = [];
  });

  it("renders nothing when embeddings aren't configured", async () => {
    embeddingConfigured = false;
    recommendations = [makeRow("1", "Naruto")];
    const element = await RecommendationsPreview({ userId: "u1" });
    const { container } = render(element ?? <></>);
    assert.equal(container.firstChild, null);
  });

  it("renders nothing when there are no recommendations", async () => {
    recommendations = [];
    const element = await RecommendationsPreview({ userId: "u1" });
    const { container } = render(element ?? <></>);
    assert.equal(container.firstChild, null);
  });

  it("shows up to 4 recommendations with a 'See all' link", async () => {
    recommendations = ["1", "2", "3", "4", "5"].map((id) => makeRow(id, `Anime ${id}`));
    const element = await RecommendationsPreview({ userId: "u1" });
    render(element);
    screen.getByText("Recommended next");
    assert.equal(screen.getAllByText(/Anime \d/).length, 4);
    const link = screen.getByRole("link", { name: /See all/ });
    assert.equal(link.getAttribute("href"), "/recommendations");
  });
});
