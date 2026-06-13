import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { LibraryEntry } from "@/lib/library/queries";
import {
  filterShuffleCandidates,
  pickFromCandidates,
} from "@/lib/library/shuffle";

function entry(
  id: string,
  anime: { format?: string | null; episodes?: number | null; genres?: string[] },
): LibraryEntry {
  return {
    id,
    status: "plan_to_watch",
    anime: {
      id: `anime-${id}`,
      format: anime.format ?? "TV",
      episodes: anime.episodes ?? 24,
      genres: anime.genres ?? [],
    },
  } as unknown as LibraryEntry;
}

describe("filterShuffleCandidates", () => {
  const entries = [
    entry("a", { format: "MOVIE", episodes: 1, genres: ["Action"] }),
    entry("b", { format: "TV", episodes: 12, genres: ["Comedy"] }),
    entry("c", { format: "TV", episodes: 50, genres: ["Action", "Drama"] }),
  ];

  it("returns everything when no filters are set", () => {
    const result = filterShuffleCandidates(entries, {
      lengthBucket: null,
      genres: [],
    });
    assert.equal(result.length, 3);
  });

  it("filters by length bucket", () => {
    const movies = filterShuffleCandidates(entries, {
      lengthBucket: "movie",
      genres: [],
    });
    assert.deepEqual(
      movies.map((e) => e.id),
      ["a"],
    );

    const longRun = filterShuffleCandidates(entries, {
      lengthBucket: "long",
      genres: [],
    });
    assert.deepEqual(
      longRun.map((e) => e.id),
      ["c"],
    );
  });

  it("filters by any-of genres", () => {
    const action = filterShuffleCandidates(entries, {
      lengthBucket: null,
      genres: ["Action"],
    });
    assert.deepEqual(
      action.map((e) => e.id),
      ["a", "c"],
    );
  });

  it("combines length and genre filters", () => {
    const result = filterShuffleCandidates(entries, {
      lengthBucket: "long",
      genres: ["Action"],
    });
    assert.deepEqual(
      result.map((e) => e.id),
      ["c"],
    );
  });
});

describe("pickFromCandidates", () => {
  it("returns null for an empty list", () => {
    assert.equal(pickFromCandidates([], "seed"), null);
  });

  it("is deterministic for a given seed", () => {
    const items = ["a", "b", "c", "d", "e"];
    assert.equal(
      pickFromCandidates(items, "spin-1"),
      pickFromCandidates(items, "spin-1"),
    );
  });

  it("can return different picks for different seeds", () => {
    const items = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const picks = new Set(
      Array.from({ length: 12 }, (_, i) => pickFromCandidates(items, `s-${i}`)),
    );
    assert.ok(picks.size > 1);
  });

  it("always returns a member of the list", () => {
    const items = ["x", "y", "z"];
    for (let i = 0; i < 20; i++) {
      assert.ok(items.includes(pickFromCandidates(items, `seed-${i}`)!));
    }
  });
});
