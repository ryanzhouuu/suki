import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { EntryEditPanel as EntryEditPanelType } from "@/components/library/entry-edit-panel";
import type { LibraryEntry } from "@/lib/library/queries";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const updateCalls: Array<{ id: string; patch: unknown }> = [];
const removeCalls: string[] = [];
let updateResult: { error?: string; message?: string } = {};
let removeResult: { error?: string } = {};

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async (id: string, patch: unknown) => {
      updateCalls.push({ id, patch });
      return updateResult;
    },
    removeAnimeEntry: async (id: string) => {
      removeCalls.push(id);
      return removeResult;
    },
  },
});

let EntryEditPanel: typeof EntryEditPanelType;

before(async () => {
  ({ EntryEditPanel } = await import("@/components/library/entry-edit-panel"));
});

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    id: "entry-1",
    status: "watching",
    progress_episodes: 5,
    personal_score: null,
    notes: null,
    started_at: null,
    completed_at: null,
    priority: null,
    rewatch_count: 0,
    anime: { episodes: 220 },
    ...overrides,
  } as unknown as LibraryEntry;
}

describe("EntryEditPanel", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    removeCalls.length = 0;
    updateResult = {};
    removeResult = {};
    router.refresh = () => {};
    delete (window as unknown as { confirm?: unknown }).confirm;
  });

  it("saves the form fields as a patch and shows the success message", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<EntryEditPanel entry={makeEntry()} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Episode progress/), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText(/Personal score/), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(updateCalls, [
      {
        id: "entry-1",
        patch: {
          status: "watching",
          progressEpisodes: 10,
          personalScore: 8,
          notes: null,
          startedAt: null,
          completedAt: null,
          priority: null,
          rewatchCount: 0,
        },
      },
    ]);
    screen.getByText("Saved.");
  });

  it("only sends a priority when the status is plan_to_watch", async () => {
    render(
      <EntryEditPanel
        entry={makeEntry({ status: "plan_to_watch" })}
        onClose={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText("Watchlist priority"), {
      target: { value: "high" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    assert.equal(
      (updateCalls[0].patch as { priority: string | null }).priority,
      "high",
    );
  });

  it("rejects a negative episode progress without calling the action", () => {
    render(<EntryEditPanel entry={makeEntry()} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Episode progress/), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    screen.getByText("Episode progress must be a non-negative integer.");
    assert.equal(updateCalls.length, 0);
  });

  it("rejects a personal score outside 0-10", () => {
    render(<EntryEditPanel entry={makeEntry()} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Personal score/), {
      target: { value: "11" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    screen.getByText("Personal score must be between 0 and 10.");
    assert.equal(updateCalls.length, 0);
  });

  it("shows a server error instead of refreshing when the save action fails", async () => {
    updateResult = { error: "Could not save" };
    render(<EntryEditPanel entry={makeEntry()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("alert");
    screen.getByText("Could not save");
  });

  it("calls onClose when Cancel is clicked", () => {
    let closed = false;
    render(<EntryEditPanel entry={makeEntry()} onClose={() => (closed = true)} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    assert.equal(closed, true);
  });

  it("does nothing when Remove is clicked and confirm is declined", () => {
    window.confirm = () => false;
    render(<EntryEditPanel entry={makeEntry()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    assert.deepEqual(removeCalls, []);
  });

  it("removes the entry, closes, and refreshes when confirm is accepted", async () => {
    window.confirm = () => true;
    let closed = false;
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(
      <EntryEditPanel entry={makeEntry()} onClose={() => (closed = true)} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(removeCalls, ["entry-1"]);
    assert.equal(closed, true);
  });
});
