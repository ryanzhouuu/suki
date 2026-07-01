import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { LibraryPanel as LibraryPanelType } from "@/components/library/library-panel";
import type { LibraryEntry } from "@/lib/library/queries";
import type { SeriesRef } from "@/lib/library/group";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { router, setPathname, setSearchParams } = installNavigationMock({
  pathname: "/library",
});

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async () => ({}),
    removeAnimeEntry: async () => ({}),
  },
});

let LibraryPanel: typeof LibraryPanelType;

before(async () => {
  ({ LibraryPanel } = await import("@/components/library/library-panel"));
});

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  const id = (overrides.id as string) ?? "entry-1";
  return {
    id,
    anime_id: `anime-${id}`,
    status: "watching",
    progress_episodes: 5,
    personal_score: null,
    priority: null,
    completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    anime: {
      anilist_id: 20,
      english_title: `Naruto ${id}`,
      romaji_title: "NARUTO",
      native_title: "NARUTO",
      cover_image_url: null,
      episodes: 220,
      genres: ["Action"],
    },
    ...overrides,
  } as unknown as LibraryEntry;
}

describe("LibraryPanel", () => {
  afterEach(() => {
    cleanup();
    setPathname("/library");
    setSearchParams("");
    router.replace = () => {};
  });

  it("renders each entry as a card", () => {
    render(
      <LibraryPanel entries={[makeEntry({ id: "1" }), makeEntry({ id: "2" })]} />,
    );
    screen.getByText("Naruto 1");
    screen.getByText("Naruto 2");
  });

  it("shows the grouped series view when group=series is in the URL", () => {
    setSearchParams("group=series");
    const seriesByAnimeId: Record<string, SeriesRef> = {
      "anime-1": {
        id: "s1",
        canonical_title: "Naruto",
        cover_image_url: null,
        slug: "naruto",
      },
    };
    render(
      <LibraryPanel
        entries={[makeEntry({ id: "1" })]}
        seriesByAnimeId={seriesByAnimeId}
      />,
    );
    screen.getByRole("button", { name: /Open Naruto/ });
  });

  it("shows the empty state with the search term when nothing matches", async () => {
    setSearchParams("q=bleach");
    render(<LibraryPanel entries={[makeEntry({ id: "1" })]} />);
    screen.getByText("No matches");
    screen.getByText(/Nothing in your library matches “bleach”/);
  });

  it("shows the match count once a search query narrows the results", () => {
    setSearchParams("q=naruto");
    render(
      <LibraryPanel entries={[makeEntry({ id: "1" }), makeEntry({ id: "2" })]} />,
    );
    // ControlRail renders the sidebar twice (mobile + desktop breakpoints).
    assert.equal(screen.getAllByText("2 of 2 entrys match").length, 2);
  });

  it("debounces typing in the search box into a `q` URL param", async () => {
    let replaced: string | null = null;
    router.replace = (href) => {
      replaced = href;
    };
    render(<LibraryPanel entries={[makeEntry({ id: "1" })]} />);
    fireEvent.change(screen.getAllByLabelText("Search your library")[0], {
      target: { value: "bleach" },
    });
    await waitFor(() => assert.equal(replaced, "/library?q=bleach"), {
      timeout: 2000,
    });
  });

  it("opens and closes an entry's edit dialog", () => {
    render(<LibraryPanel entries={[makeEntry({ id: "1" })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    screen.getByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    assert.equal(screen.queryByRole("dialog"), null);
  });
});
