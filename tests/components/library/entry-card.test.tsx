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

  it("shows progress, status, and edit/delete actions in the card menu", () => {
    render(<EntryCard entry={makeEntry()} onEdit={() => {}} />);
    screen.getByText("EP 5");
    screen.getByRole("button", { name: "+ Episode" });
    assert.equal(
      screen.queryByRole("button", { name: "set episodes watched" }),
      null,
    );
    screen.getByText("Watching");
    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Naruto" }),
    );
    screen.getByRole("menu", { name: "Actions for Naruto" });
    screen.getByRole("menuitem", { name: "Edit" });
    screen.getByRole("menuitem", { name: "Delete" });
    assert.equal(screen.queryByRole("button", { name: "Remove" }), null);
    assert.equal(screen.queryByRole("button", { name: "Completed" }), null);
  });

  it("does not render an Edit button when onEdit is omitted", () => {
    render(<EntryCard entry={makeEntry()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Naruto" }),
    );
    assert.equal(screen.queryByRole("menuitem", { name: "Edit" }), null);
    screen.getByRole("menuitem", { name: "Delete" });
  });

  it("calls onEdit and closes the menu when Edit is selected", () => {
    let edited = false;
    render(
      <EntryCard
        entry={makeEntry()}
        onEdit={() => {
          edited = true;
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Naruto" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    assert.equal(edited, true);
    assert.equal(screen.queryByRole("menu"), null);
  });

  it("closes the menu on Escape and returns focus to the trigger", () => {
    render(<EntryCard entry={makeEntry()} />);
    const trigger = screen.getByRole("button", {
      name: "More actions for Naruto",
    });
    fireEvent.click(trigger);
    screen.getByRole("menu");
    fireEvent.keyDown(document, { key: "Escape" });
    assert.equal(screen.queryByRole("menu"), null);
    assert.equal(document.activeElement, trigger);
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

  it("increments progress and refreshes the router on '+ Episode'", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<EntryCard entry={makeEntry({ progress_episodes: 5 })} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Episode" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(updateCalls, [
      { id: "entry-1", patch: { progressEpisodes: 6 } },
    ]);
  });

  it("reverts the optimistic count and offers a retry when the update fails", async () => {
    updateResult = { error: "failed" };
    render(<EntryCard entry={makeEntry({ progress_episodes: 5 })} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Episode" }));
    await waitFor(() => screen.getByText("Couldn’t save"));
    screen.getByText("EP 5");
  });

  it("does not remove the entry when the confirm dialog is declined", () => {
    window.confirm = () => false;
    render(<EntryCard entry={makeEntry()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Naruto" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    assert.deepEqual(removeCalls, []);
  });

  it("removes the entry and refreshes when confirm is accepted", async () => {
    window.confirm = () => true;
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<EntryCard entry={makeEntry()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Naruto" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(removeCalls, ["entry-1"]);
  });
});
