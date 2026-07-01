import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AiringRowItem as AiringRowItemType } from "@/components/home/airing-row";
import type { AiringRow } from "@/lib/anime/airing";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const updateCalls: Array<{ id: string; patch: unknown }> = [];
let updateResult: { error?: string } = {};

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async (id: string, patch: unknown) => {
      updateCalls.push({ id, patch });
      return updateResult;
    },
  },
});

let AiringRowItem: typeof AiringRowItemType;

before(async () => {
  ({ AiringRowItem } = await import("@/components/home/airing-row"));
});

function makeRow(overrides: Partial<AiringRow> = {}): AiringRow {
  return {
    entryId: "entry-1",
    anilistId: 20,
    title: "Naruto",
    coverUrl: null,
    nextEpisodeNumber: 5,
    airingAt: Math.floor(Date.now() / 1000) + 3600,
    episodesBehind: 0,
    progressEpisodes: 3,
    totalEpisodes: null,
    ...overrides,
  };
}

describe("AiringRowItem", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    updateResult = {};
    router.refresh = () => {};
  });

  it("shows the title and time until the next episode", () => {
    render(<AiringRowItem row={makeRow({ airingAt: Math.floor(Date.now() / 1000) + 7200 })} />);
    screen.getByText("Naruto");
    screen.getByText(
      (_content, element) =>
        element?.tagName === "P" && /Ep\s*5\s*in\s*\d+h/.test(element.textContent ?? ""),
    );
  });

  it("shows an 'N behind' badge when progress trails the latest aired episode", () => {
    render(
      <AiringRowItem
        row={makeRow({ nextEpisodeNumber: 6, progressEpisodes: 3 })}
      />,
    );
    screen.getByText("2 behind");
  });

  it("hides the behind badge when caught up", () => {
    render(
      <AiringRowItem row={makeRow({ nextEpisodeNumber: 5, progressEpisodes: 4 })} />,
    );
    assert.equal(screen.queryByText(/behind/), null);
  });

  it("bumps progress optimistically and refreshes on success", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<AiringRowItem row={makeRow({ progressEpisodes: 3 })} />);
    fireEvent.click(screen.getByRole("button", { name: "+1 ep" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(updateCalls, [
      { id: "entry-1", patch: { progressEpisodes: 4 } },
    ]);
  });

  it("marks completed when progress reaches totalEpisodes", async () => {
    render(<AiringRowItem row={makeRow({ progressEpisodes: 11, totalEpisodes: 12 })} />);
    fireEvent.click(screen.getByRole("button", { name: "+1 ep" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    assert.deepEqual(updateCalls[0].patch, { progressEpisodes: 12, status: "completed" });
  });

  it("reverts the optimistic bump when the update fails", async () => {
    updateResult = { error: "failed" };
    render(<AiringRowItem row={makeRow({ nextEpisodeNumber: 6, progressEpisodes: 3 })} />);
    fireEvent.click(screen.getByRole("button", { name: "+1 ep" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    screen.getByText("2 behind");
  });
});
