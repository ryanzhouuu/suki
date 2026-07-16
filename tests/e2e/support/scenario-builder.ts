import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  createLocalAdminClient,
  throwOnSupabaseError,
} from "./admin-client";
import {
  FIXTURE_ANIME,
  FIXTURE_ANIME_SERIES_MAP,
  FIXTURE_SERIES,
  fixtureAnimeId,
} from "./fixture-catalog";
import {
  FIXTURE_PASSWORD,
  FIXTURE_USERS,
  type FixtureUserIds,
  type FixtureUserName,
} from "./fixture-users";

type AdminClient = SupabaseClient<Database>;

async function ensureFixtureUser(
  admin: AdminClient,
  name: FixtureUserName,
  resetPassword: boolean,
): Promise<string> {
  const fixture = FIXTURE_USERS[name];
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1_000,
  });
  if (listError) throw new Error(`E2E fixture user lookup failed: ${listError.message}`);

  const existing = list.users.find((user) => user.email === fixture.email);
  if (existing) {
    if (resetPassword) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        ...(resetPassword ? { password: FIXTURE_PASSWORD } : {}),
        email_confirm: true,
      });
      if (error) throw new Error(`E2E fixture user update failed: ${error.message}`);
    }
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: fixture.email,
    password: FIXTURE_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`E2E fixture user creation failed: ${error?.message ?? "missing user"}`);
  }
  return data.user.id;
}

export async function ensureFixtureUsers(
  admin = createLocalAdminClient(),
  options: { resetPasswords?: boolean } = {},
): Promise<FixtureUserIds> {
  const resetPassword = options.resetPasswords ?? true;
  return {
    onboarding: await ensureFixtureUser(admin, "onboarding", resetPassword),
    library: await ensureFixtureUser(admin, "library", resetPassword),
    signout: await ensureFixtureUser(admin, "signout", resetPassword),
  };
}

export async function upsertFixtureCatalog(
  admin = createLocalAdminClient(),
): Promise<void> {
  const animeResult = await admin.from("anime").upsert(FIXTURE_ANIME, {
    onConflict: "anilist_id",
  });
  throwOnSupabaseError("catalog anime upsert", animeResult.error);

  const seriesResult = await admin.from("series").upsert(FIXTURE_SERIES, {
    onConflict: "id",
  });
  throwOnSupabaseError("catalog series upsert", seriesResult.error);

  const mapResult = await admin
    .from("anime_series_map")
    .upsert(FIXTURE_ANIME_SERIES_MAP, { onConflict: "anime_id" });
  throwOnSupabaseError("catalog series map upsert", mapResult.error);
}

async function clearScenarioRows(admin: AdminClient, userId: string): Promise<void> {
  for (const table of ["user_events", "user_anime_entries", "profiles"] as const) {
    const result = await admin.from(table).delete().eq("user_id", userId);
    throwOnSupabaseError(`${table} reset`, result.error);
  }
}

async function insertFixtureProfile(
  admin: AdminClient,
  userId: string,
  name: "library" | "signout",
): Promise<void> {
  const result = await admin.from("profiles").insert({
    user_id: userId,
    username: FIXTURE_USERS[name].username,
    display_name: FIXTURE_USERS[name].displayName,
    bio: `A deterministic ${name} fixture.`,
    profile_visibility: "public",
    show_activity_to_friends: true,
  });
  throwOnSupabaseError("library profile insert", result.error);
}

async function insertLibraryEntries(admin: AdminClient, userId: string): Promise<void> {
  const result = await admin.from("user_anime_entries").insert([
    {
      user_id: userId,
      anime_id: fixtureAnimeId(1001),
      status: "watching",
      progress_episodes: 3,
      personal_score: 8.5,
      notes: "Initial library note",
      started_at: "2026-01-10",
    },
    {
      user_id: userId,
      anime_id: fixtureAnimeId(1003),
      status: "completed",
      progress_episodes: 24,
      personal_score: 9.5,
      completed_at: "2026-02-14",
    },
    {
      user_id: userId,
      anime_id: fixtureAnimeId(1004),
      status: "plan_to_watch",
      progress_episodes: 0,
      priority: "high",
    },
  ]);
  throwOnSupabaseError("library entries insert", result.error);
}

export async function resetScenario(
  name: "onboarding" | "library" | "signout",
): Promise<FixtureUserIds> {
  const admin = createLocalAdminClient();
  await upsertFixtureCatalog(admin);
  const users = await ensureFixtureUsers(admin, { resetPasswords: false });
  const userId = users[name];
  await clearScenarioRows(admin, userId);

  if (name === "library" || name === "signout") {
    await insertFixtureProfile(admin, userId, name);
  }

  if (name === "library") {
    await insertLibraryEntries(admin, userId);
  }

  return users;
}

export async function prepareFixtures(): Promise<void> {
  const admin = createLocalAdminClient();
  await upsertFixtureCatalog(admin);
  await ensureFixtureUsers(admin);
  await resetScenario("onboarding");
  await resetScenario("library");
  await resetScenario("signout");
}
