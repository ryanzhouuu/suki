import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { WatchlistShuffle as WatchlistShuffleType } from "@/components/library/watchlist-shuffle";
import type { LibraryEntry } from "@/lib/library/queries";

const updateCalls: Array<{ id: string; patch: unknown }> = [];
const shuffleLogCalls: unknown[] = [];
let updateResult: { error?: string } = {};

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async (id: string, patch: unknown) => {
      updateCalls.push({ id, patch });
      return updateResult;
    },
  },
});

mock.module("@/actions/shuffle", {
  namedExports: {
    logWatchlistShuffle: async (payload: unknown) => {
      shuffleLogCalls.push(payload);
    },
  },
});

let WatchlistShuffle: typeof WatchlistShuffleType;

before(async () => {
  ({ WatchlistShuffle } = await import(
    "@/components/library/watchlist-shuffle"
  ));
});

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  const id = (overrides.id as string) ?? "entry-1";
  return {
    id,
    status: "plan_to_watch",
    anime: {
      anilist_id: 20,
      english_title: `Naruto ${id}`,
      romaji_title: "NARUTO",
      native_title: "NARUTO",
      cover_image_url: null,
      episodes: 220,
      format: "TV",
      genres: ["Action"],
    },
    ...overrides,
  } as unknown as LibraryEntry;
}

describe("WatchlistShuffle", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    shuffleLogCalls.length = 0;
    updateResult = {};
  });

  it("disables the Shuffle button when there are no entries", () => {
    render(<WatchlistShuffle entries={[]} />);
    const button = screen.getByRole("button", { name: "Shuffle" });
    assert.equal(button.hasAttribute("disabled"), true);
  });

  it("picks the only candidate and logs the shuffle when spinning with one entry", async () => {
    render(<WatchlistShuffle entries={[makeEntry({ id: "1" })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    screen.getByText("Naruto 1");
    await waitFor(() => assert.equal(shuffleLogCalls.length, 1));
    assert.deepEqual(shuffleLogCalls[0], {
      anilistId: 20,
      lengthBucket: null,
      genres: [],
    });
  });

  it("shows 'Spin again' after the first spin", () => {
    render(<WatchlistShuffle entries={[makeEntry({ id: "1" })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    // The header button and the pick panel's button both read "Spin again".
    assert.equal(screen.getAllByRole("button", { name: "Spin again" }).length, 2);
  });

  it("shows the no-match message when filters exclude every entry", () => {
    render(<WatchlistShuffle entries={[makeEntry({ id: "1", anime: { anilist_id: 20, format: "TV", episodes: 220, genres: ["Action"] } as never })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Movie" }));
    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    screen.getByText(/Nothing in your watchlist matches those filters/);
  });

  it("hides the length/genre filters in compact mode", () => {
    render(<WatchlistShuffle entries={[makeEntry({ id: "1" })]} compact />);
    assert.equal(screen.queryByRole("button", { name: "Movie" }), null);
    assert.equal(screen.queryByText("Genres"), null);
  });

  it("starts watching the pick, excludes it, and shows the confirmation", async () => {
    render(<WatchlistShuffle entries={[makeEntry({ id: "1" })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    fireEvent.click(screen.getByRole("button", { name: "Start watching" }));

    await waitFor(() => assert.equal(updateCalls.length, 1));
    assert.deepEqual(updateCalls[0], {
      id: "1",
      patch: { status: "watching" },
    });
    await screen.findByText(/Now watching/);
    screen.getByRole("link", { name: "Naruto 1" });
    // The entry is now excluded, so there's nothing left to shuffle.
    assert.equal(screen.getByRole("button", { name: "Spin again" }).hasAttribute("disabled"), true);
  });

  it("shows an error instead of confirming when the update action fails", async () => {
    updateResult = { error: "Could not update" };
    render(<WatchlistShuffle entries={[makeEntry({ id: "1" })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    fireEvent.click(screen.getByRole("button", { name: "Start watching" }));
    await screen.findByText("Could not update");
    assert.equal(screen.queryByText(/Now watching/), null);
  });
});
