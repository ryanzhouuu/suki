import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { EntryCard as EntryCardType } from "@/components/library/entry-card";
import type { LibraryEntry } from "@/lib/library/queries";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const updateCalls: Array<{ id: string; patch: unknown }> = [];
const removeCalls: string[] = [];
let updateResult: { error?: string } = {};

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async (id: string, patch: unknown) => {
      updateCalls.push({ id, patch });
      return updateResult;
    },
    removeAnimeEntry: async (id: string) => {
      removeCalls.push(id);
      return {};
    },
  },
});

let EntryCard: typeof EntryCardType;

before(async () => {
  ({ EntryCard } = await import("@/components/library/entry-card"));
});

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    id: "entry-1",
    status: "watching",
    progress_episodes: 5,
    personal_score: null,
    priority: null,
    completed_at: null,
    anime: {
      anilist_id: 20,
      english_title: "Naruto",
      romaji_title: "NARUTO",
      native_title: "NARUTO",
      cover_image_url: null,
      episodes: 220,
    },
    ...overrides,
  } as unknown as LibraryEntry;
}

describe("EntryCard", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    removeCalls.length = 0;
    updateResult = {};
    router.refresh = () => {};
    // @ts-expect-error -- happy-dom doesn't implement confirm by default.
    delete window.confirm;
  });

  it("shows progress and an 'Edit' action when onEdit is provided", () => {
    render(<EntryCard entry={makeEntry()} onEdit={() => {}} />);
    screen.getByText("EP 5");
    screen.getByRole("button", { name: "Edit" });
  });

  it("does not render an Edit button when onEdit is omitted", () => {
    render(<EntryCard entry={makeEntry()} />);
    assert.equal(screen.queryByRole("button", { name: "Edit" }), null);
  });

  it("shows an in-progress meta line for non-watching entries with progress", () => {
    render(
      <EntryCard entry={makeEntry({ status: "paused", progress_episodes: 12 })} />,
    );
    screen.getByText("12 / 220 eps");
  });

  it("shows a 'Done' button only once progress reaches the episode total", () => {
    render(<EntryCard entry={makeEntry({ progress_episodes: 219 })} />);
    assert.equal(screen.queryByRole("button", { name: "Done" }), null);

    cleanup();
    render(<EntryCard entry={makeEntry({ progress_episodes: 220 })} />);
    screen.getByRole("button", { name: "Done" });
  });

  it("increments progress and refreshes the router on '+1 ep'", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<EntryCard entry={makeEntry({ progress_episodes: 5 })} />);
    fireEvent.click(screen.getByRole("button", { name: "+1 ep" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(updateCalls, [
      { id: "entry-1", patch: { progressEpisodes: 6 } },
    ]);
  });

  it("marks completed and reverts the optimistic status on error", async () => {
    updateResult = { error: "failed" };
    render(<EntryCard entry={makeEntry({ status: "watching" })} />);
    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    screen.getByText("Watching");
  });

  it("does not remove the entry when the confirm dialog is declined", () => {
    window.confirm = () => false;
    render(<EntryCard entry={makeEntry()} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    assert.deepEqual(removeCalls, []);
  });

  it("removes the entry and refreshes when confirm is accepted", async () => {
    window.confirm = () => true;
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<EntryCard entry={makeEntry()} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(removeCalls, ["entry-1"]);
  });
});
