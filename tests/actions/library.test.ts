import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { Tables } from "@/types/database";

import {
  assertRedirect,
  createActionRuntime,
  installActionRuntimeMocks,
  type ActionRuntime,
} from "../helpers/action-runtime";

type Anime = Tables<"anime">;
type Entry = Tables<"user_anime_entries"> & { anime?: Anime | null };

const user = { id: "user-1" } as never;
const anime = {
  id: "anime-1",
  anilist_id: 1001,
  romaji_title: "Moonlit Couriers",
  english_title: "Moonlit Couriers",
  native_title: null,
  description: null,
  cover_image_url: null,
  banner_image_url: null,
  format: "TV",
  episodes: 12,
  duration_minutes: 24,
  season: "WINTER",
  season_year: 2026,
  status: "FINISHED",
  genres: ["Adventure"],
  average_score: 82,
  popularity: 100,
  source: "ORIGINAL",
  metadata_updated_at: "2026-01-01T00:00:00.000Z",
} as unknown as Anime;

const counters = {
  sync: 0,
  mapping: 0,
  recompute: 0,
};

let syncResult: Anime | null = anime;

mock.module("@/lib/anime/sync", {
  namedExports: {
    syncAnimeFromAnilist: async () => {
      counters.sync += 1;
      if (!syncResult) throw new Error("AniList unavailable");
      return syncResult;
    },
  },
});
mock.module("@/lib/series/resolver", {
  namedExports: {
    ensureAnimeSeriesMapping: async () => {
      counters.mapping += 1;
    },
  },
});
mock.module("@/lib/ranking/recompute-series", {
  namedExports: {
    recomputeUserRanking: async () => {
      counters.recompute += 1;
    },
  },
});

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "entry-1",
    user_id: "user-1",
    anime_id: anime.id,
    status: "watching",
    progress_episodes: 3,
    rewatch_count: 0,
    priority: null,
    notes: null,
    personal_score: null,
    started_at: null,
    completed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    anime,
    ...overrides,
  };
}

type FakeOptions = {
  entries?: Entry[];
  animeRow?: Anime | null;
  insertError?: string;
  updateError?: string;
  deleteError?: string;
};

function createLibraryClient(options: FakeOptions = {}) {
  const entries = [...(options.entries ?? [])];
  const animeRow = options.animeRow === undefined ? anime : options.animeRow;

  function matchingEntries(filters: Record<string, unknown>) {
    return entries.filter((entry) =>
      Object.entries(filters).every(([key, value]) => entry[key as keyof Entry] === value),
    );
  }

  function entrySelection(columns: string) {
    const filters: Record<string, unknown> = {};
    const chain = {
      eq(field: string, value: unknown) {
        filters[field] = value;
        return chain;
      },
      async maybeSingle() {
        const match = matchingEntries(filters)[0] ?? null;
        return {
          data:
            match && columns.includes("anime")
              ? { ...match, anime: match.anime ?? anime }
              : match,
          error: null,
        };
      },
      async single() {
        const match = matchingEntries(filters)[0] ?? null;
        return {
          data:
            match && columns.includes("anime")
              ? { ...match, anime: match.anime ?? anime }
              : match,
          error: null,
        };
      },
    };
    return chain;
  }

  function mutation(kind: "update" | "delete", values?: Partial<Entry>) {
    const filters: Record<string, unknown> = {};
    const chain = {
      eq(field: string, value: unknown) {
        filters[field] = value;
        return chain;
      },
      select() {
        return {
          maybeSingle: async () => {
            const index = entries.findIndex((entry) =>
              Object.entries(filters).every(([key, value]) => entry[key as keyof Entry] === value),
            );
            if (index < 0) return { data: null, error: null };
            const [removed] = entries.splice(index, 1);
            return { data: { id: removed.id }, error: options.deleteError ? { message: options.deleteError } : null };
          },
        };
      },
      then(resolve: (value: { error: { message: string } | null }) => unknown) {
        const index = entries.findIndex((entry) =>
          Object.entries(filters).every(([key, value]) => entry[key as keyof Entry] === value),
        );
        const errorMessage = kind === "update" ? options.updateError : options.deleteError;
        if (!errorMessage && index >= 0 && kind === "update") {
          entries[index] = { ...entries[index], ...values };
        }
        return Promise.resolve(resolve({ error: errorMessage ? { message: errorMessage } : null }));
      },
    };
    return chain;
  }

  return {
    entries,
    from(table: string) {
      if (table === "anime") {
        return {
          select() {
            return {
              eq(_field: string, value: unknown) {
                return {
                  maybeSingle: async () => ({
                    data: animeRow && value === animeRow.anilist_id ? animeRow : null,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }
      return {
        select(columns: string) {
          return entrySelection(columns);
        },
        insert(values: Entry | Entry[]) {
          return Promise.resolve({
            error: options.insertError ? { message: options.insertError } : null,
            data: options.insertError
              ? null
              : entries.push(...(Array.isArray(values) ? values : [values])),
          });
        },
        update(values: Partial<Entry>) {
          return mutation("update", values);
        },
        delete() {
          return mutation("delete");
        },
      };
    },
  };
}

let runtime: ActionRuntime;
let addAnimeEntry: typeof import("@/actions/library").addAnimeEntry;
let updateAnimeEntry: typeof import("@/actions/library").updateAnimeEntry;
let removeAnimeEntry: typeof import("@/actions/library").removeAnimeEntry;

before(async () => {
  runtime = createActionRuntime();
  installActionRuntimeMocks(runtime);
  ({ addAnimeEntry, updateAnimeEntry, removeAnimeEntry } = await import("@/actions/library"));
});

beforeEach(() => {
  counters.sync = 0;
  counters.mapping = 0;
  counters.recompute = 0;
  syncResult = anime;
  runtime.resetCaptures();
  runtime.setActor({ user, profile: null, client: createLibraryClient() });
});

describe("library actions", () => {
  it("redirects unauthenticated add attempts before resolving anime", async () => {
    runtime.setActor({ user: null });

    await assert.rejects(
      () => addAnimeEntry(1001, "watching"),
      (error: unknown) => {
        assertRedirect(error, "/auth/login");
        return true;
      },
    );
    assert.equal(counters.sync, 0);
    assert.deepEqual(runtime.scheduledAfterCallbacks, []);
    assert.deepEqual(runtime.revalidatedPaths, []);
  });

  it("adds a cached anime and delays its event and cache work", async () => {
    const client = createLibraryClient();
    runtime.setActor({ client });

    const result = await addAnimeEntry(1001, "watching");

    assert.deepEqual(result, { message: "Added to your library." });
    assert.equal(counters.sync, 0);
    assert.deepEqual(runtime.eventCalls, []);
    assert.deepEqual(runtime.revalidatedPaths, []);
    assert.equal(runtime.scheduledAfterCallbacks.length, 2);

    await runtime.flushAfterCallbacks();
    assert.deepEqual(runtime.eventCalls, [
      { userId: "user-1", eventType: "anime_added", animeId: anime.id, metadata: { status: "watching" } },
    ]);
    assert.deepEqual(runtime.revalidatedPaths, ["/library", "/setup/library", "/anime/1001", "/home"]);
    assert.equal(client.entries.length, 1);
  });

  it("updates an existing row instead of inserting a duplicate", async () => {
    const existing = makeEntry();
    const client = createLibraryClient({ entries: [existing] });
    runtime.setActor({ client });

    const result = await addAnimeEntry(1001, "completed");
    assert.deepEqual(result, { message: "Already in your library. Status updated." });
    assert.equal(client.entries.length, 1);
    assert.equal(client.entries[0].id, existing.id);
    assert.equal(client.entries[0].status, "completed");
    assert.equal(client.entries[0].progress_episodes, 12);

    await runtime.flushAfterCallbacks();
    assert.deepEqual(runtime.eventCalls.map((event) => event.eventType), [
      "status_changed",
      "anime_completed",
    ]);
    assert.equal(counters.mapping, 1);
    assert.equal(counters.recompute, 1);
    assert.ok(runtime.revalidatedPaths.includes("/ranking"));
  });

  it("maps resolver failures to a safe action error without side effects", async () => {
    syncResult = null;
    const client = createLibraryClient({ animeRow: null });
    runtime.setActor({ client });

    const result = await addAnimeEntry(9999, "watching");

    assert.deepEqual(result, { error: "AniList unavailable" });
    assert.equal(client.entries.length, 0);
    assert.deepEqual(runtime.scheduledAfterCallbacks, []);
    assert.deepEqual(runtime.revalidatedPaths, []);
  });

  it("rejects invalid and no-op updates before mutation", async () => {
    const client = createLibraryClient({ entries: [makeEntry()] });
    runtime.setActor({ client });

    assert.deepEqual(
      await updateAnimeEntry("entry-1", { progressEpisodes: 13 }),
      { error: "Episode progress cannot exceed 12." },
    );
    assert.deepEqual(await updateAnimeEntry("entry-1", {}), { message: "No changes to save." });
    assert.equal(client.entries[0].progress_episodes, 3);
    assert.deepEqual(runtime.scheduledAfterCallbacks, []);
  });

  it("logs distinct status, progress, and rich-field changes", async () => {
    const client = createLibraryClient({ entries: [makeEntry()] });
    runtime.setActor({ client });

    const result = await updateAnimeEntry("entry-1", {
      status: "paused",
      progressEpisodes: 5,
      notes: "A better note",
    });

    assert.deepEqual(result, { message: "Updated." });
    await runtime.flushAfterCallbacks();
    assert.deepEqual(runtime.eventCalls.map((event) => event.eventType), [
      "status_changed",
      "progress_updated",
      "library_entry_updated",
    ]);
    assert.deepEqual(runtime.eventCalls[2].metadata, { changedFields: ["notes"] });
    assert.deepEqual(runtime.revalidatedPaths, ["/library", "/setup/library", "/anime/1001", "/home"]);
  });

  it("returns the same safe not-found result for another owner's entry", async () => {
    const client = createLibraryClient({ entries: [makeEntry({ user_id: "user-2" })] });
    runtime.setActor({ client });

    assert.deepEqual(await updateAnimeEntry("entry-1", { notes: "intrusion" }), { error: "Entry not found." });
    assert.deepEqual(await removeAnimeEntry("entry-1"), { error: "Entry not found." });
    assert.equal(client.entries.length, 1);
    assert.deepEqual(runtime.eventCalls, []);
    assert.deepEqual(runtime.scheduledAfterCallbacks, []);
  });

  it("removes an owned entry and schedules ranking/event work", async () => {
    const client = createLibraryClient({ entries: [makeEntry()] });
    runtime.setActor({ client });

    const result = await removeAnimeEntry("entry-1");
    assert.deepEqual(result, { message: "Removed from library." });
    assert.equal(client.entries.length, 0);
    assert.deepEqual(runtime.revalidatedPaths, []);

    await runtime.flushAfterCallbacks();
    assert.deepEqual(runtime.eventCalls, [
      { userId: "user-1", eventType: "library_entry_removed", metadata: { entryId: "entry-1" } },
    ]);
    assert.deepEqual(runtime.revalidatedPaths, ["/library", "/setup/library", "/home", "/ranking"]);
    assert.equal(counters.recompute, 1);
  });

  it("does not report success when the database rejects an insert", async () => {
    const client = createLibraryClient({ insertError: "database unavailable" });
    runtime.setActor({ client });

    assert.deepEqual(await addAnimeEntry(1001, "watching"), { error: "database unavailable" });
    assert.deepEqual(runtime.scheduledAfterCallbacks, []);
    assert.deepEqual(runtime.revalidatedPaths, []);
  });
});
