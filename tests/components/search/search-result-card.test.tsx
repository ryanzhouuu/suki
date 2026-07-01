import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SearchResultCard as SearchResultCardType } from "@/components/search/search-result-card";
import type { AniListMediaSummary } from "@/lib/anilist/types";

const addAnimeEntryCalls: Array<{ id: number; status: string }> = [];

mock.module("@/actions/library", {
  namedExports: {
    addAnimeEntry: async (id: number, status: string) => {
      addAnimeEntryCalls.push({ id, status });
      return {};
    },
  },
});

let SearchResultCard: typeof SearchResultCardType;

before(async () => {
  ({ SearchResultCard } = await import(
    "@/components/search/search-result-card"
  ));
});

function makeMedia(overrides: Partial<AniListMediaSummary> = {}): AniListMediaSummary {
  return {
    id: 20,
    title: { romaji: "NARUTO", english: "Naruto", native: null },
    coverImage: null,
    format: "TV",
    episodes: 220,
    seasonYear: 2002,
    status: "FINISHED",
    genres: ["Action", "Adventure"],
    ...overrides,
  } as unknown as AniListMediaSummary;
}

describe("SearchResultCard", () => {
  afterEach(() => {
    cleanup();
    addAnimeEntryCalls.length = 0;
  });

  it("shows the title, meta line, and genres", () => {
    render(<SearchResultCard media={makeMedia()} />);
    screen.getByText("Naruto");
    screen.getByText("TV · 2002 · 220 eps");
    screen.getByText("Action · Adventure");
  });

  it("highlights the initialStatus button", () => {
    render(<SearchResultCard media={makeMedia()} initialStatus="watching" />);
    const button = screen.getByRole("button", { name: "Watching" });
    assert.match(button.className, /bg-accent/);
  });

  it("adds the entry with the clicked status", async () => {
    render(<SearchResultCard media={makeMedia()} />);
    fireEvent.click(screen.getByRole("button", { name: "Plan to watch" }));
    await waitFor(() => assert.equal(addAnimeEntryCalls.length, 1));
    assert.deepEqual(addAnimeEntryCalls[0], { id: 20, status: "plan_to_watch" });
    assert.match(
      screen.getByRole("button", { name: "Plan to watch" }).className,
      /bg-accent/,
    );
  });
});
