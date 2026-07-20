import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  assertLocalE2eEnvironment,
  type E2eEnvironment,
} from "./local-safety";
import {
  ACTION_FIXTURE_USERS,
  E2E_FIXTURE_USERS,
  FIXTURE_PASSWORD,
  type ActionFixtureUserName,
  type FixtureUserName,
} from "./fixture-users";

type AuthenticatedFixtureName = FixtureUserName | ActionFixtureUserName;

export type AuthenticatedClient = {
  client: SupabaseClient<Database>;
  user: User;
  cleanup: () => Promise<void>;
};

export async function createAuthenticatedClient(
  name: AuthenticatedFixtureName,
  expectedUserId?: string,
): Promise<AuthenticatedClient> {
  assertLocalE2eEnvironment(process.env as E2eEnvironment);
  const fixture = E2E_FIXTURE_USERS[name as FixtureUserName] ?? ACTION_FIXTURE_USERS[name as ActionFixtureUserName];
  if (!fixture) throw new Error(`Unknown local fixture user: ${name}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Local test environment is missing the Supabase publishable key.");
  }

  const client = createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: fixture.email,
    password: FIXTURE_PASSWORD,
  });
  if (error || !data.user) {
    throw new Error(`Local fixture sign-in failed: ${error?.message ?? "missing user"}`);
  }
  if (expectedUserId && data.user.id !== expectedUserId) {
    throw new Error(`Local fixture identity mismatch for ${name}.`);
  }

  return {
    client,
    user: data.user,
    cleanup: async () => {
      await client.auth.signOut();
    },
  };
}
