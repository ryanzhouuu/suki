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

  it("shows an interactive ticker for watching entries outside the meta box", () => {
    const { container } = render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({ status: "watching", progress_episodes: 50 })}
        anime={anime}
      />,
    );
    const progressLabel = screen.getByText("Progress");
    const metaBox = container.querySelector(".bg-surface-2\\/40");
    assert.ok(metaBox);
    assert.equal(metaBox?.contains(progressLabel), false);
    screen.getByRole("button", { name: "Naruto: set episodes watched" });
    screen.getByRole("button", { name: "Naruto: log next episode watched" });
    screen.getByText("EP 50");
    screen.getByRole("progressbar", {
      name: "50 of 220 episodes watched",
    });
    assert.equal(screen.queryByText("50 / 220 episodes"), null);
  });

  it("shows an interactive ticker for paused entries too", () => {
    render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({ status: "paused", progress_episodes: 12 })}
        anime={anime}
      />,
    );
    screen.getByRole("button", { name: "Naruto: log next episode watched" });
  });

  it("shows a read-only progress readout once completed", () => {
    render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({ status: "completed", progress_episodes: 220 })}
        anime={anime}
      />,
    );
    screen.getByText("220 / 220 episodes");
    assert.equal(
      screen.queryByRole("button", { name: /log next episode watched/ }),
      null,
    );
  });

  it("shows score and notes with fallbacks instead of a status row", () => {
    render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({ personal_score: null, notes: null })}
        anime={anime}
      />,
    );
    assert.equal(screen.queryByText("Status"), null);
    screen.getByText("Not scored");
    screen.getByText("No notes yet");
  });

  it("shows score and notes when present", () => {
    render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({ personal_score: 8, notes: "Great opener" })}
        anime={anime}
      />,
    );
    screen.getByText("8/10");
    screen.getByText("Great opener");
    assert.equal(screen.queryByText("Not scored"), null);
    assert.equal(screen.queryByText("No notes yet"), null);
  });

  it("keeps started and updated dates in the meta box", () => {
    render(
      <AnimeLibrarySection
        anilistId={1}
        entry={makeEntry({
          started_at: "2024-01-15",
          updated_at: "2024-02-01T12:00:00Z",
        })}
        anime={anime}
      />,
    );
    screen.getByText("Started");
    screen.getByText("Jan 15, 2024");
    screen.getByText("Updated");
    screen.getByText("Feb 1, 2024");
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
