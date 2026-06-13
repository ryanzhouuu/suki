import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AnimeEntryStatus } from "@/lib/constants";
import {
  filterGroups,
  filterGroupsByStatus,
  groupLibraryEntries,
  primaryStatusFor,
  sortLibraryGroups,
  statusSummary,
  type LibraryGroup,
  type SeriesRef,
} from "@/lib/library/group";
import type { LibraryEntry } from "@/lib/library/queries";

let nextId = 1;

function entry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  const id = `e${nextId++}`;
  const animeId = overrides.anime_id ?? `a-${id}`;
  return {
    id,
    user_id: "u1",
    anime_id: animeId,
    status: "plan_to_watch",
    progress_episodes: 0,
    rewatch_count: 0,
    priority: "medium",
    notes: null,
    personal_score: null,
    started_at: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
    ...overrides,
    anime: {
      id: animeId,
      anilist_id: 1,
      romaji_title: "Beta",
      english_title: "Beta",
      native_title: null,
      description: null,
      cover_image_url: null,
      banner_image_url: null,
      format: "TV",
      episodes: 12,
      duration_minutes: null,
      season: null,
      season_year: 2020,
      status: "FINISHED",
      genres: ["Action"],
      average_score: null,
      popularity: null,
      source: null,
      metadata_updated_at: "",
      ...overrides.anime,
    },
  };
}

function series(id: string): SeriesRef {
  return {
    id,
    canonical_title: `Series ${id}`,
    cover_image_url: null,
    slug: id,
  };
}

function map(pairs: Array<[string, SeriesRef]>): Map<string, SeriesRef> {
  return new Map(pairs);
}

describe("primaryStatusFor", () => {
  it("picks the highest-priority status (watching beats completed)", () => {
    const status = primaryStatusFor([
      entry({ status: "completed" }),
      entry({ status: "watching" }),
      entry({ status: "plan_to_watch" }),
    ]);
    assert.equal(status, "watching");
  });

  it("falls through the priority order when no watching entry exists", () => {
    const status = primaryStatusFor([
      entry({ status: "dropped" }),
      entry({ status: "completed" }),
    ]);
    assert.equal(status, "completed");
  });
});

describe("groupLibraryEntries", () => {
  it("collapses entries sharing a series into one group", () => {
    const e1 = entry({ anime_id: "s1-a" });
    const e2 = entry({ anime_id: "s1-b" });
    const groups = groupLibraryEntries(
      [e1, e2],
      map([
        ["s1-a", series("s1")],
        ["s1-b", series("s1")],
      ]),
    );

    assert.equal(groups.length, 1);
    assert.equal(groups[0].series?.id, "s1");
    assert.equal(groups[0].entries.length, 2);
    assert.equal(groups[0].key, "s1");
  });

  it("keeps unmapped entries as standalone single-entry groups", () => {
    const e1 = entry({ anime_id: "lonely" });
    const groups = groupLibraryEntries([e1], map([]));

    assert.equal(groups.length, 1);
    assert.equal(groups[0].series, null);
    assert.equal(groups[0].entries.length, 1);
    assert.equal(groups[0].key, `anime:${e1.id}`);
  });

  it("preserves first-seen order across groups", () => {
    const a = entry({ anime_id: "x" }); // standalone, seen first
    const b = entry({ anime_id: "s1-a" });
    const c = entry({ anime_id: "s1-b" });
    const groups = groupLibraryEntries(
      [a, b, c],
      map([
        ["s1-a", series("s1")],
        ["s1-b", series("s1")],
      ]),
    );

    assert.equal(groups.length, 2);
    assert.equal(groups[0].series, null); // a came first
    assert.equal(groups[1].series?.id, "s1");
  });

  it("computes status counts and a primary status for a group", () => {
    const groups = groupLibraryEntries(
      [
        entry({ anime_id: "s1-a", status: "completed" }),
        entry({ anime_id: "s1-b", status: "completed" }),
        entry({ anime_id: "s1-c", status: "watching" }),
      ],
      map([
        ["s1-a", series("s1")],
        ["s1-b", series("s1")],
        ["s1-c", series("s1")],
      ]),
    );

    assert.equal(groups[0].primaryStatus, "watching");
    assert.equal(groups[0].statusCounts.completed, 2);
    assert.equal(groups[0].statusCounts.watching, 1);
  });
});

describe("statusSummary", () => {
  it("lists non-zero status counts in priority order", () => {
    const groups = groupLibraryEntries(
      [
        entry({ anime_id: "s1-a", status: "completed" }),
        entry({ anime_id: "s1-b", status: "completed" }),
        entry({ anime_id: "s1-c", status: "watching" }),
      ],
      map([
        ["s1-a", series("s1")],
        ["s1-b", series("s1")],
        ["s1-c", series("s1")],
      ]),
    );

    assert.equal(statusSummary(groups[0]), "1 watching, 2 completed");
  });
});

describe("filterGroupsByStatus", () => {
  function mixedGroup(): LibraryGroup {
    return groupLibraryEntries(
      [
        entry({ anime_id: "s1-a", status: "completed" }),
        entry({ anime_id: "s1-b", status: "watching" }),
      ],
      map([
        ["s1-a", series("s1")],
        ["s1-b", series("s1")],
      ]),
    )[0];
  }

  it("keeps a group when any entry matches the status", () => {
    const groups = filterGroupsByStatus([mixedGroup()], "watching");
    assert.equal(groups.length, 1);
  });

  it("drops a group when no entry matches the status", () => {
    const groups = filterGroupsByStatus([mixedGroup()], "dropped");
    assert.equal(groups.length, 0);
  });

  it("returns all groups when no status filter is given", () => {
    const groups = filterGroupsByStatus([mixedGroup()], undefined);
    assert.equal(groups.length, 1);
  });
});

describe("filterGroups", () => {
  it("keeps a group when any entry matches the title query", () => {
    const group = groupLibraryEntries(
      [
        entry({
          anime_id: "s1-a",
          anime: { english_title: "Naruto" } as LibraryEntry["anime"],
        }),
        entry({
          anime_id: "s1-b",
          anime: { english_title: "Shippuden" } as LibraryEntry["anime"],
        }),
      ],
      map([
        ["s1-a", series("s1")],
        ["s1-b", series("s1")],
      ]),
    );

    assert.equal(filterGroups(group, { query: "naruto" }).length, 1);
    assert.equal(filterGroups(group, { query: "bleach" }).length, 0);
  });
});

describe("sortLibraryGroups", () => {
  it("orders groups by their best personal_score (desc)", () => {
    const low = groupLibraryEntries(
      [entry({ anime_id: "low", personal_score: 5, status: "completed" })],
      map([]),
    )[0];
    const high = groupLibraryEntries(
      [
        entry({ anime_id: "hi-a", personal_score: 6, status: "completed" }),
        entry({ anime_id: "hi-b", personal_score: 9, status: "completed" }),
      ],
      map([
        ["hi-a", series("hi")],
        ["hi-b", series("hi")],
      ]),
    )[0];

    const sorted = sortLibraryGroups([low, high], "personal_score", "desc");
    assert.equal(sorted[0].series?.id, "hi");
  });

  it("orders groups by their most-recent completed_at (desc)", () => {
    const older = groupLibraryEntries(
      [entry({ anime_id: "old", completed_at: "2023-01-01", status: "completed" })],
      map([]),
    )[0];
    const newer = groupLibraryEntries(
      [
        entry({ anime_id: "new-a", completed_at: "2022-01-01", status: "completed" }),
        entry({ anime_id: "new-b", completed_at: "2024-06-01", status: "completed" }),
      ],
      map([
        ["new-a", series("new")],
        ["new-b", series("new")],
      ]),
    )[0];

    const sorted = sortLibraryGroups([older, newer], "completed_at", "desc");
    assert.equal(sorted[0].series?.id, "new");
  });
});

// Guard against unused-import lint for the status type in assertions.
const _statusCheck: AnimeEntryStatus = "watching";
void _statusCheck;
