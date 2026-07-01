import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  SeriesGroupDetailsDialog as SeriesGroupDetailsDialogType,
  libraryEntryTitle as libraryEntryTitleType,
  libraryGroupCover as libraryGroupCoverType,
  libraryGroupTitle as libraryGroupTitleType,
} from "@/components/library/series-group-details-dialog";
import type { LibraryGroup } from "@/lib/library/group";
import type { LibraryEntry } from "@/lib/library/queries";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const updateCalls: Array<{ id: string; patch: unknown }> = [];

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async (id: string, patch: unknown) => {
      updateCalls.push({ id, patch });
      return {};
    },
    removeAnimeEntry: async () => ({}),
  },
});

let SeriesGroupDetailsDialog: typeof SeriesGroupDetailsDialogType;
let libraryEntryTitle: typeof libraryEntryTitleType;
let libraryGroupTitle: typeof libraryGroupTitleType;
let libraryGroupCover: typeof libraryGroupCoverType;

before(async () => {
  ({ SeriesGroupDetailsDialog, libraryEntryTitle, libraryGroupTitle, libraryGroupCover } =
    await import("@/components/library/series-group-details-dialog"));
});

function makeEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  const id = (overrides.id as string) ?? "entry-1";
  return {
    id,
    status: "watching",
    progress_episodes: 5,
    personal_score: null,
    priority: null,
    completed_at: null,
    anime: {
      anilist_id: 20,
      english_title: `Naruto ${id}`,
      romaji_title: "NARUTO",
      native_title: "NARUTO",
      cover_image_url: null,
      episodes: 220,
      format: "TV",
      season_year: 2002,
    },
    ...overrides,
  } as unknown as LibraryEntry;
}

function makeGroup(entries: LibraryEntry[], series: LibraryGroup["series"] = null): LibraryGroup {
  return {
    key: series?.id ?? "standalone",
    series,
    entries,
    primaryStatus: entries[0]?.status ?? "watching",
    statusCounts: {
      watching: entries.filter((e) => e.status === "watching").length,
      completed: 0,
      paused: 0,
      plan_to_watch: 0,
      dropped: 0,
    },
  };
}

describe("library title/cover helpers", () => {
  it("libraryEntryTitle falls back through english/romaji/native/Unknown", () => {
    assert.equal(
      libraryEntryTitle(makeEntry({ anime: { english_title: "EN" } as never })),
      "EN",
    );
    assert.equal(
      libraryEntryTitle(
        makeEntry({
          anime: { english_title: "", romaji_title: "RO", native_title: "NA" } as never,
        }),
      ),
      "RO",
    );
    assert.equal(
      libraryEntryTitle(makeEntry({ anime: {} as never })),
      "Unknown",
    );
  });

  it("libraryGroupTitle prefers the series canonical_title over the first entry", () => {
    const group = makeGroup([makeEntry({ id: "1" })], {
      id: "s1",
      canonical_title: "Naruto Shippuden",
      cover_image_url: null,
      slug: "naruto",
    });
    assert.equal(libraryGroupTitle(group), "Naruto Shippuden");
  });

  it("libraryGroupTitle falls back to the first entry's title when there's no series", () => {
    const group = makeGroup([makeEntry({ id: "solo" })]);
    assert.equal(libraryGroupTitle(group), "Naruto solo");
  });

  it("libraryGroupCover prefers the series cover over the first entry's", () => {
    const group = makeGroup(
      [makeEntry({ id: "1", anime: { cover_image_url: "entry-cover.jpg" } as never })],
      { id: "s1", canonical_title: "X", cover_image_url: "series-cover.jpg", slug: "x" },
    );
    assert.equal(libraryGroupCover(group), "series-cover.jpg");
  });
});

describe("SeriesGroupDetailsDialog", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    router.refresh = () => {};
  });

  it("renders nothing when closed", () => {
    render(
      <SeriesGroupDetailsDialog
        group={makeGroup([makeEntry()])}
        open={false}
        onClose={() => {}}
      />,
    );
    assert.equal(screen.queryByRole("dialog"), null);
  });

  it("lists each entry with its status and title when open", () => {
    render(
      <SeriesGroupDetailsDialog
        group={makeGroup([makeEntry({ id: "1" }), makeEntry({ id: "2" })])}
        open
        onClose={() => {}}
      />,
    );
    screen.getByRole("link", { name: "View Naruto 1" });
    screen.getByRole("link", { name: "View Naruto 2" });
  });

  it("increments an entry's progress via '+1 ep' and refreshes", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(
      <SeriesGroupDetailsDialog
        group={makeGroup([makeEntry({ id: "1", progress_episodes: 10 })])}
        open
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "+1 ep" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(updateCalls, [
      { id: "1", patch: { progressEpisodes: 11 } },
    ]);
  });

  it("does not show a '+1 ep' button for non-watching entries", () => {
    render(
      <SeriesGroupDetailsDialog
        group={makeGroup([makeEntry({ id: "1", status: "completed" })])}
        open
        onClose={() => {}}
      />,
    );
    assert.equal(screen.queryByRole("button", { name: "+1 ep" }), null);
  });

  it("opens an entry's edit panel and closes it via Cancel", () => {
    render(
      <SeriesGroupDetailsDialog
        group={makeGroup([makeEntry({ id: "1" })])}
        open
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    screen.getByLabelText(/Episode progress/);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    assert.equal(screen.queryByLabelText(/Episode progress/), null);
  });

  it("calls onClose (and clears any open editor) when the dialog closes", () => {
    let closed = false;
    render(
      <SeriesGroupDetailsDialog
        group={makeGroup([makeEntry({ id: "1" })])}
        open
        onClose={() => (closed = true)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    assert.equal(closed, true);
  });
});
