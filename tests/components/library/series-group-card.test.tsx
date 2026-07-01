import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { SeriesGroupCard } from "@/components/library/series-group-card";
import type { LibraryGroup } from "@/lib/library/group";
import type { LibraryEntry } from "@/lib/library/queries";

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  const id = (overrides.id as string) ?? "entry-1";
  return {
    id,
    anime_id: `anime-${id}`,
    status: "watching",
    score: null,
    notes: null,
    watchlist_priority: null,
    updated_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    anime: {
      id: `anime-${id}`,
      english_title: `Naruto Entry ${id}`,
      romaji_title: "NARUTO",
      native_title: "NARUTO",
      cover_image_url: null,
      format: "TV",
      season_year: 2002,
    },
    ...overrides,
  } as unknown as LibraryEntry;
}

function makeGroup(entries: LibraryEntry[]): LibraryGroup {
  const statusCounts = {
    watching: 0,
    completed: 0,
    paused: 0,
    plan_to_watch: 0,
    dropped: 0,
  } as LibraryGroup["statusCounts"];
  for (const entry of entries) statusCounts[entry.status] += 1;

  return {
    key: "series-1",
    series: {
      id: "series-1",
      canonical_title: "Naruto",
      cover_image_url: null,
      slug: "naruto",
    },
    entries,
    primaryStatus: entries[0]?.status ?? "watching",
    statusCounts,
  };
}

describe("SeriesGroupCard", () => {
  it("renders the series title, entry count, and status summary", () => {
    const group = makeGroup([
      makeEntry({ id: "1", status: "watching" }),
      makeEntry({ id: "2", status: "completed" }),
    ]);
    render(<SeriesGroupCard group={group} />);
    screen.getByText("Naruto");
    screen.getByText("2 entries");
    screen.getByText("1 watching, 1 completed");
    cleanup();
  });

  it("uses singular 'entry' for a single-entry group", () => {
    render(<SeriesGroupCard group={makeGroup([makeEntry()])} />);
    screen.getByText("1 entry");
    cleanup();
  });

  it("shows 'Open N more' when entries exceed the 3-item preview", () => {
    const entries = ["1", "2", "3", "4", "5"].map((id) => makeEntry({ id }));
    render(<SeriesGroupCard group={makeGroup(entries)} />);
    screen.getByText("Open 2 more");
    cleanup();
  });

  it("shows 'Open details' when all entries fit the preview", () => {
    render(<SeriesGroupCard group={makeGroup([makeEntry()])} />);
    screen.getByText("Open details");
    cleanup();
  });

  it("opens the details dialog when the card is clicked", () => {
    // Entries left empty: SeriesGroupDetailsDialog's entry rows need an
    // app router context to render, which is out of scope for this test —
    // we're only exercising SeriesGroupCard's own open/close toggle.
    render(<SeriesGroupCard group={makeGroup([])} />);
    assert.equal(screen.queryByRole("dialog"), null);
    fireEvent.click(screen.getByRole("button", { name: "Open Naruto" }));
    screen.getByRole("dialog");
    cleanup();
  });
});
