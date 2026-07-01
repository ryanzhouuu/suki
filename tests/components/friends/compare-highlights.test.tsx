import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { CompareHighlights } from "@/components/friends/compare-highlights";
import type { TasteMatchProfile } from "@/lib/friends/taste-similarity";

function makeMatch(overrides: Partial<TasteMatchProfile> = {}): TasteMatchProfile {
  return {
    similarity: { status: "ready", score: 80, label: "Great match", confidence: "high" },
    highlights: {
      sharedFavorites: [],
      biggestDisagreements: [],
      sharedCompletedSeriesCount: 3,
    },
    sharedGenres: [],
    genreDifferences: [],
    formatDifferences: [],
    viewerLovedFriendUnwatched: [],
    friendLovedViewerUnwatched: [],
    sharedPlanToWatch: [],
    ...overrides,
  };
}

describe("CompareHighlights", () => {
  it("shows the shared completed count, pluralized, and a collaborative-picks link", () => {
    render(
      <CompareHighlights
        match={makeMatch({
          highlights: {
            sharedFavorites: [],
            biggestDisagreements: [],
            sharedCompletedSeriesCount: 1,
          },
        })}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText(/1 completed franchise in common/);
    const link = screen.getByRole("link", { name: /Open collaborative picks/ });
    assert.equal(link.getAttribute("href"), "/friends/compare/alexj/recommendations");
    cleanup();
  });

  it("pluralizes franchise count when more than one", () => {
    render(
      <CompareHighlights
        match={makeMatch()}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText(/3 completed franchises in common/);
    cleanup();
  });

  it("shows empty-state copy for each section when there's no data", () => {
    render(
      <CompareHighlights
        match={makeMatch()}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText("Rank more series in common to see aligned favorites.");
    screen.getByText(
      "No ranked overlap yet — keep comparing series you both finished.",
    );
    screen.getByText(
      "You need more overlapping completed or in-progress entries to surface shared genres.",
    );
    screen.getByText("No strong genre differences yet.");
    screen.getByText("No strong format differences yet.");
    screen.getByText("Add more highly rated or completed entries to surface picks.");
    screen.getByText(
      "Alex needs more highly rated or completed entries to surface picks.",
    );
    screen.getByText("Add more watchlist entries to find overlap.");
    cleanup();
  });

  it("renders shared favorites with rank delta", () => {
    render(
      <CompareHighlights
        match={makeMatch({
          highlights: {
            sharedFavorites: [
              {
                seriesId: "s1",
                title: "Naruto",
                coverImageUrl: null,
                viewerRank: 1,
                friendRank: 3,
                rankDelta: 2,
              },
            ],
            biggestDisagreements: [],
            sharedCompletedSeriesCount: 1,
          },
        })}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText("Naruto");
    screen.getByText("Rank #1 vs #3 · Δ2");
    cleanup();
  });

  it("renders shared genre strengths", () => {
    render(
      <CompareHighlights
        match={makeMatch({
          sharedGenres: [
            { genre: "Action", viewerCount: 5, friendCount: 3, combinedCount: 8 },
          ],
        })}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText("Action");
    screen.getByText("5 for you · 3 for friend");
    cleanup();
  });

  it("renders genre differences with a favored-by label", () => {
    render(
      <CompareHighlights
        match={makeMatch({
          genreDifferences: [
            { genre: "Romance", viewerCount: 1, friendCount: 5, delta: -4 },
          ],
        })}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText("Romance");
    screen.getByText("Leans toward Alex");
    cleanup();
  });

  it("renders discovery picks with a personal score", () => {
    render(
      <CompareHighlights
        match={makeMatch({
          viewerLovedFriendUnwatched: [
            {
              animeId: "a1",
              title: "One Piece",
              coverImageUrl: null,
              personalScore: 9,
            },
          ],
        })}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText("One Piece");
    screen.getByText("Personal score: 9");
    cleanup();
  });

  it("renders shared plan-to-watch entries with priority", () => {
    render(
      <CompareHighlights
        match={makeMatch({
          sharedPlanToWatch: [
            {
              animeId: "a2",
              title: "Frieren",
              coverImageUrl: null,
              viewerPriority: "high",
              friendPriority: null,
            },
          ],
        })}
        viewerLabel="You"
        friendLabel="Alex"
        friendUsername="alexj"
      />,
    );
    screen.getByText("Frieren");
    screen.getByText("Priority: you (high) · Alex (none)");
    cleanup();
  });
});
