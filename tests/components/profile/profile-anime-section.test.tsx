import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ProfileAnimeSection } from "@/components/profile/profile-anime-section";
import type { LibraryEntry } from "@/lib/library/queries";

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  const id = (overrides.id as string) ?? "1";
  return {
    id,
    status: "completed",
    personal_score: null,
    completed_at: null,
    progress_episodes: 0,
    anime: {
      anilist_id: 20,
      english_title: `Anime ${id}`,
      romaji_title: `ANIME ${id}`,
      cover_image_url: null,
      episodes: 24,
    },
    ...overrides,
  } as unknown as LibraryEntry;
}

describe("ProfileAnimeSection", () => {
  it("renders nothing when there are no entries", () => {
    const { container } = render(
      <ProfileAnimeSection title="Favorites" entries={[]} />,
    );
    assert.equal(container.firstChild, null);
    cleanup();
  });

  it("shows the title, eyebrow, and each entry", () => {
    render(
      <ProfileAnimeSection
        title="Favorites"
        eyebrow="Top picks"
        entries={[makeEntry({ id: "1" }), makeEntry({ id: "2" })]}
      />,
    );
    screen.getByRole("heading", { name: "Favorites" });
    screen.getByText("Top picks");
    screen.getByText("Anime 1");
    screen.getByText("Anime 2");
    cleanup();
  });

  it("shows the personal score when showScore is set", () => {
    render(
      <ProfileAnimeSection
        title="Favorites"
        entries={[makeEntry({ personal_score: 9 })]}
        showScore
      />,
    );
    screen.getByText("9/10");
    cleanup();
  });

  it("shows watching progress for in-progress entries", () => {
    render(
      <ProfileAnimeSection
        title="Watching"
        entries={[makeEntry({ status: "watching", progress_episodes: 5 })]}
      />,
    );
    screen.getByText("5/24 eps");
    cleanup();
  });

  it("collapses to 10 entries with a 'Show all' toggle when collapsible", () => {
    const entries = Array.from({ length: 12 }, (_, i) => makeEntry({ id: String(i) }));
    render(<ProfileAnimeSection title="All" entries={entries} collapsible />);
    assert.equal(screen.queryByText("Anime 11"), null);
    fireEvent.click(screen.getByRole("button", { name: "Show all 12" }));
    screen.getByText("Anime 11");
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    assert.equal(screen.queryByText("Anime 11"), null);
    cleanup();
  });

  it("does not show a toggle when entries fit within the default visible count", () => {
    render(
      <ProfileAnimeSection title="All" entries={[makeEntry()]} collapsible />,
    );
    assert.equal(screen.queryByRole("button"), null);
    cleanup();
  });
});
