import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database";

import {
  createAuthenticatedClient,
  type AuthenticatedClient,
} from "../../support/local-supabase/authenticated-client";
import {
  resetLibraryActionScenario,
  type LibraryActionScenario,
} from "../../support/local-supabase/scenario-builder";
import { fixtureAnimeId } from "../../support/local-supabase/fixture-catalog";
import {
  createIntegrationActionRuntime,
  installIntegrationActionRuntimeMocks,
} from "../../helpers/integration-action-runtime";
import { createLocalAdminClient } from "../../support/local-supabase/admin-client";

mock.module("@/lib/series/resolver", {
  namedExports: {
    ensureAnimeSeriesMapping: async () => undefined,
  },
});
mock.module("@/lib/ranking/recompute-series", {
  namedExports: {
    recomputeUserRanking: async () => undefined,
  },
});

const runtime = createIntegrationActionRuntime();
installIntegrationActionRuntimeMocks(runtime);

let addAnimeEntry: typeof import("@/actions/library").addAnimeEntry;
let updateAnimeEntry: typeof import("@/actions/library").updateAnimeEntry;
let removeAnimeEntry: typeof import("@/actions/library").removeAnimeEntry;
let scenario: LibraryActionScenario;
let alice: AuthenticatedClient;
let bob: AuthenticatedClient;
let admin: SupabaseClient<Database>;

before(async () => {
  ({ addAnimeEntry, updateAnimeEntry, removeAnimeEntry } = await import("@/actions/library"));
});

async function profileFor(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<Tables<"profiles">> {
  const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).single();
  if (error || !data) throw new Error(`Missing integration profile: ${error?.message ?? "unknown"}`);
  return data;
}

async function rowsFor(userId: string, animeId = scenario.aliceAnimeId) {
  const { data, error } = await admin
    .from("user_anime_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("anime_id", animeId);
  if (error) throw new Error(`Library verification failed: ${error.message}`);
  return data;
}

beforeEach(async () => {
  for (const session of [alice, bob]) {
    if (session) await session.cleanup();
  }
  runtime.resetCaptures();
  admin = createLocalAdminClient();
  scenario = await resetLibraryActionScenario(admin);
  alice = await createAuthenticatedClient("actionAlice", scenario.users.actionAlice);
  bob = await createAuthenticatedClient("actionBob", scenario.users.actionBob);
  await runtime.setIntegrationActor({
    user: alice.user,
    profile: await profileFor(alice.client, alice.user.id),
    client: alice.client,
  });
});

describe("library actions against local Supabase", () => {
  it("persists one cached title and its delayed event for Alice", async () => {
    const result = await addAnimeEntry(1002, "watching");
    assert.deepEqual(result, { message: "Added to your library." });
    assert.equal((await rowsFor(alice.user.id, fixtureAnimeId(1002))).length, 1);
    assert.deepEqual(runtime.eventCalls, []);

    await runtime.flushAfterCallbacks();
    const { data: events, error } = await admin
      .from("user_events")
      .select("event_type, anime_id, metadata")
      .eq("user_id", alice.user.id);
    if (error) throw new Error(`Event verification failed: ${error.message}`);
    assert.deepEqual(events, [
      {
        event_type: "anime_added",
        anime_id: fixtureAnimeId(1002),
        metadata: { status: "watching" },
      },
    ]);
    assert.deepEqual(runtime.revalidatedPaths, ["/library", "/setup/library", "/anime/1002", "/home"]);
  });

  it("repeating an add updates the same unique row and completes it", async () => {
    assert.deepEqual(await addAnimeEntry(1001, "watching"), { message: "Added to your library." });
    const first = (await rowsFor(alice.user.id))[0];
    assert.ok(first);

    await runtime.flushAfterCallbacks();
    runtime.resetCaptures();
    assert.deepEqual(await addAnimeEntry(1001, "completed"), {
      message: "Already in your library. Status updated.",
    });
    const rows = await rowsFor(alice.user.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, first.id);
    assert.equal(rows[0].status, "completed");
    assert.equal(rows[0].progress_episodes, 12);
    assert.ok(rows[0].completed_at);
  });

  it("cannot update or remove Bob's entry through Alice's action", async () => {
    const { data: bobRows, error } = await admin
      .from("user_anime_entries")
      .select("*")
      .eq("user_id", bob.user.id)
      .eq("anime_id", scenario.bobAnimeId);
    if (error || !bobRows?.[0]) throw new Error(`Missing Bob fixture row: ${error?.message ?? "unknown"}`);

    assert.deepEqual(await updateAnimeEntry(bobRows[0].id, { notes: "forged" }), { error: "Entry not found." });
    assert.deepEqual(await removeAnimeEntry(bobRows[0].id), { error: "Entry not found." });

    const { data: unchanged, error: verifyError } = await admin
      .from("user_anime_entries")
      .select("notes, status, progress_episodes")
      .eq("id", bobRows[0].id)
      .single();
    if (verifyError || !unchanged) throw new Error(`Cross-owner verification failed: ${verifyError?.message ?? "unknown"}`);
    assert.deepEqual(unchanged, { notes: null, status: "watching", progress_episodes: 3 });
    assert.deepEqual(runtime.eventCalls, []);
  });

  it("removes only Alice's owned row and persists its event", async () => {
    assert.deepEqual(await addAnimeEntry(1005, "watching"), { message: "Added to your library." });
    await runtime.flushAfterCallbacks();
    runtime.resetCaptures();

    const { data: aliceRows, error } = await admin
      .from("user_anime_entries")
      .select("id")
      .eq("user_id", alice.user.id)
      .eq("anime_id", fixtureAnimeId(1005));
    if (error || !aliceRows?.[0]) throw new Error(`Missing Alice row: ${error?.message ?? "unknown"}`);

    assert.deepEqual(await removeAnimeEntry(aliceRows[0].id), { message: "Removed from library." });
    await runtime.flushAfterCallbacks();
    assert.deepEqual(runtime.eventCalls[0], {
      userId: alice.user.id,
      eventType: "library_entry_removed",
      metadata: { entryId: aliceRows[0].id },
    });
    const { data: deleted } = await admin
      .from("user_anime_entries")
      .select("id")
      .eq("id", aliceRows[0].id);
    assert.deepEqual(deleted, []);
  });
});
