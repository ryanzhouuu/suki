import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AnimeLibrarySection as AnimeLibrarySectionType } from "@/components/anime/anime-library-section";
import type { Tables } from "@/types/database";

import { installRouterMock } from "../../helpers/mock-router";

installRouterMock();

mock.module("@/actions/library", {
  namedExports: {
    addAnimeEntry: async () => ({}),
    updateAnimeEntry: async () => ({}),
    removeAnimeEntry: async () => ({}),
  },
});

let AnimeLibrarySection: typeof AnimeLibrarySectionType;

before(async () => {
  ({ AnimeLibrarySection } = await import(
    "@/components/anime/anime-library-section"
  ));
});

const anime = {
  id: "anime-1",
  english_title: "Naruto",
  romaji_title: "NARUTO",
  native_title: "NARUTO",
  episodes: 220,
} as unknown as Tables<"anime">;

function makeEntry(overrides: Partial<Tables<"user_anime_entries">> = {}) {
  return {
    id: "entry-1",
    status: "watching",
    progress_episodes: 50,
    personal_score: null,
    priority: null,
    rewatch_count: 0,
    started_at: null,
    completed_at: null,
    updated_at: null,
    notes: null,
    ...overrides,
  } as unknown as Tables<"user_anime_entries">;
}

describe("AnimeLibrarySection", () => {
  afterEach(() => cleanup());

  it("shows the status picker without entry details when there's no entry", () => {
    render(<AnimeLibrarySection anilistId={1} entry={null} anime={anime} />);
    screen.getByText("Your list");
    screen.getByRole("button", { name: "Watching" });
    assert.equal(screen.queryByText("Progress"), null);
  });

  it("shows entry details (status, progress, score) when an entry exists", () => {
    const entry = makeEntry({ personal_score: 8 });
    render(<AnimeLibrarySection anilistId={1} entry={entry} anime={anime} />);
    screen.getByText("Progress");
    screen.getByText("50 / 220 episodes");
    screen.getByText("8/10");
  });

  it("only shows a Ranking link when the entry is completed", () => {
    const { rerender } = render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({ status: "watching" })}
        anime={anime}
      />,
    );
    assert.equal(screen.queryByRole("link", { name: "Ranking" }), null);

    rerender(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({ status: "completed" })}
        anime={anime}
      />,
    );
    screen.getByRole("link", { name: "Ranking" });
  });

  it("opens the edit dialog when 'Edit details' is clicked", () => {
    render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry()}
        anime={anime}
      />,
    );
    assert.equal(screen.queryByRole("dialog"), null);
    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    screen.getByRole("dialog");
  });
});
