import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { QuickAddResult as QuickAddResultType } from "@/components/setup/quick-add-result";
import type { AniListMediaSummary } from "@/lib/anilist/types";

const addAnimeEntryCalls: Array<{ id: number; status: string }> = [];
let addAnimeEntryResult: { error?: string } = {};
let addAnimeEntryDelayMs = 0;

mock.module("@/actions/library", {
  namedExports: {
    addAnimeEntry: async (id: number, status: string) => {
      addAnimeEntryCalls.push({ id, status });
      if (addAnimeEntryDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, addAnimeEntryDelayMs));
      }
      return addAnimeEntryResult;
    },
  },
});

let QuickAddResult: typeof QuickAddResultType;

before(async () => {
  ({ QuickAddResult } = await import("@/components/setup/quick-add-result"));
});

function makeMedia(
  overrides: Partial<AniListMediaSummary> = {},
): AniListMediaSummary {
  return {
    id: 20,
    title: { romaji: "NARUTO", english: "Naruto", native: null },
    coverImage: null,
    format: "TV",
    episodes: 220,
    seasonYear: 2002,
    status: "FINISHED",
    genres: ["Action"],
    ...overrides,
  } as unknown as AniListMediaSummary;
}

describe("QuickAddResult", () => {
  afterEach(() => {
    cleanup();
    addAnimeEntryCalls.length = 0;
    addAnimeEntryResult = {};
    addAnimeEntryDelayMs = 0;
  });

  it("calls addAnimeEntry and updates the selected status", async () => {
    render(<QuickAddResult media={makeMedia()} />);
    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    await waitFor(() => assert.equal(addAnimeEntryCalls.length, 1));
    assert.deepEqual(addAnimeEntryCalls[0], { id: 20, status: "completed" });
    assert.match(
      screen.getByRole("button", { name: "Completed" }).className,
      /bg-accent/,
    );
  });

  it("disables only the pending row controls", async () => {
    addAnimeEntryDelayMs = 50;
    render(
      <>
        <QuickAddResult media={makeMedia({ id: 1 })} />
        <QuickAddResult
          media={makeMedia({
            id: 2,
            title: { romaji: "BLEACH", english: null, native: null },
          })}
        />
      </>,
    );

    const firstCompleted = screen.getAllByRole("button", { name: "Completed" })[0];
    const secondWatching = screen.getAllByRole("button", { name: "Watching" })[1];

    fireEvent.click(firstCompleted);
    assert.equal(firstCompleted.hasAttribute("disabled"), true);
    assert.equal(secondWatching.hasAttribute("disabled"), false);

    await waitFor(() => assert.equal(addAnimeEntryCalls.length, 1));
  });

  it("shows an inline error and restores the prior status on failure", async () => {
    addAnimeEntryResult = { error: "Could not save" };
    render(
      <QuickAddResult media={makeMedia()} initialStatus="watching" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    await waitFor(() => screen.getByText("Could not save"));
    assert.match(
      screen.getByRole("button", { name: "Watching" }).className,
      /bg-accent/,
    );
  });
});
