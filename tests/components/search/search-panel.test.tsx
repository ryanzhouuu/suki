import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { SearchPanel as SearchPanelType } from "@/components/search/search-panel";
import type { AniListMediaSummary } from "@/lib/anilist/types";

import { installNavigationMock } from "../../helpers/mock-navigation";

installNavigationMock({ pathname: "/search" });

mock.module("@/actions/library", {
  namedExports: {
    getLibraryStatusMap: async () => ({}),
    addAnimeEntry: async () => ({}),
  },
});

let SearchPanel: typeof SearchPanelType;

before(async () => {
  ({ SearchPanel } = await import("@/components/search/search-panel"));
});

function makeMedia(id: number, title: string): AniListMediaSummary {
  return {
    id,
    title: { romaji: title, english: title, native: null },
    coverImage: null,
    format: "TV",
    episodes: 12,
    seasonYear: 2020,
    status: "FINISHED",
    genres: [],
  } as unknown as AniListMediaSummary;
}

const originalFetch = globalThis.fetch;

function stubFetch(handler: () => Promise<Response>) {
  globalThis.fetch = (async () => handler()) as typeof fetch;
}

describe("SearchPanel", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  it("shows the empty prompt before any query or filter is active", () => {
    render(<SearchPanel />);
    screen.getByText("Start typing or pick filters");
  });

  it("shows results after typing a query (debounced fetch)", async () => {
    stubFetch(async () =>
      new Response(JSON.stringify({ media: [makeMedia(1, "Naruto")] }), {
        status: 200,
      }),
    );
    render(<SearchPanel />);
    fireEvent.change(screen.getByLabelText("Search anime"), {
      target: { value: "naruto" },
    });
    await screen.findByText("Naruto", {}, { timeout: 2000 });
  });

  it("shows a no-results message with the query when nothing matches", async () => {
    stubFetch(async () =>
      new Response(JSON.stringify({ media: [] }), { status: 200 }),
    );
    render(<SearchPanel />);
    fireEvent.change(screen.getByLabelText("Search anime"), {
      target: { value: "zzz" },
    });
    await screen.findByText("No results for “zzz”.", {}, { timeout: 2000 });
  });

  it("shows an error alert when the search request fails", async () => {
    stubFetch(async () =>
      new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 }),
    );
    render(<SearchPanel />);
    fireEvent.change(screen.getByLabelText("Search anime"), {
      target: { value: "naruto" },
    });
    await screen.findByRole("alert", {}, { timeout: 2000 });
  });

  it("toggles a format filter and shows/clears it via 'Clear all'", () => {
    render(<SearchPanel />);
    assert.equal(screen.queryByRole("button", { name: "Clear all" }), null);
    const movieButtons = screen.getAllByRole("button", { name: "Movie" });
    fireEvent.click(movieButtons[0]);
    assert.equal(movieButtons[0].getAttribute("aria-pressed"), "true");
    fireEvent.click(screen.getAllByRole("button", { name: "Clear all" })[0]);
    assert.equal(movieButtons[0].getAttribute("aria-pressed"), "false");
  });

  it("selects a sort option", () => {
    render(<SearchPanel />);
    const scoreButtons = screen.getAllByRole("button", { name: "Highest rated" });
    fireEvent.click(scoreButtons[0]);
    assert.equal(scoreButtons[0].getAttribute("aria-pressed"), "true");
  });
});
