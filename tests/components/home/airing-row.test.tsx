import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AiringRowItem as AiringRowItemType } from "@/components/home/airing-row";
import { formatAiringCredit, type AiringRow } from "@/lib/anime/airing";

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

  it("formats the air time in the browser timezone, not a saved profile zone", () => {
    // Two days out keeps a clock time in the credit in every zone; a fixed date would expire.
    const airingAt = Math.floor(Date.now() / 1000) + 2 * 24 * 3600;
    const local = formatAiringCredit(airingAt, Date.now());
    const saved = formatAiringCredit(airingAt, Date.now(), "Pacific/Kiritimati");
    assert.notEqual(local.time, saved.time);

    render(<AiringRowItem row={makeRow({ airingAt })} />);

    const credit = screen.getByText(local.day).closest("p");
    assert.match(credit?.textContent ?? "", new RegExp(escapeRegExp(local.time ?? "")));
    assert.equal(credit?.textContent?.includes(saved.time ?? "___"), false);
  });

  it("leads with an airing credit once the clock is known", async () => {
    render(
      <AiringRowItem
        row={makeRow({ airingAt: Math.floor(Date.now() / 1000) - 60 })}
      />,
    );
    await screen.findByText("Out now");
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

  it("logs progress optimistically and refreshes on success", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<AiringRowItem row={makeRow({ progressEpisodes: 3 })} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: log next episode watched" }),
    );
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(updateCalls, [
      { id: "entry-1", patch: { progressEpisodes: 4 } },
    ]);
  });

  it("lets the server auto-complete when progress reaches totalEpisodes", async () => {
    render(<AiringRowItem row={makeRow({ progressEpisodes: 11, totalEpisodes: 12 })} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: log next episode watched" }),
    );
    await waitFor(() => assert.equal(updateCalls.length, 1));
    assert.deepEqual(updateCalls[0].patch, { progressEpisodes: 12 });
  });

  it("reverts the optimistic bump when the update fails", async () => {
    updateResult = { error: "failed" };
    render(<AiringRowItem row={makeRow({ nextEpisodeNumber: 6, progressEpisodes: 3 })} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: log next episode watched" }),
    );
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    screen.getByText("2 behind");
  });
});
