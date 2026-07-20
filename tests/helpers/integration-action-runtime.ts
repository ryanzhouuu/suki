import { mock } from "node:test";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Json, Tables } from "@/types/database";

import {
  createActionRuntime,
  type ActionActor,
  type ActionRuntime,
} from "./action-runtime";

export type IntegrationActor = {
  user: User;
  profile: Tables<"profiles">;
  client: SupabaseClient<Database>;
};

export function createIntegrationActionRuntime() {
  const runtime = createActionRuntime();

  runtime.logUserEvent = async (userId, eventType, options) => {
    runtime.eventCalls.push({ userId, eventType, ...options });
    const actor = runtime.currentActor;
    if (!actor.client || typeof actor.client !== "object") {
      throw new Error("Integration action runtime has no authenticated client.");
    }
    const client = actor.client as SupabaseClient<Database>;
    const write = client.from("user_events").insert({
      user_id: userId,
      event_type: eventType,
      anime_id: options?.animeId ?? null,
      metadata: (options?.metadata ?? {}) as Json,
    });
    runtime.trackPendingWork(Promise.resolve(write).then(({ error }) => {
      if (error) throw new Error(`Integration event write failed: ${error.message}`);
    }));
  };

  const integrationRuntime = runtime as ActionRuntime & {
    setIntegrationActor: (actor: IntegrationActor) => Promise<void>;
  };

  integrationRuntime.setIntegrationActor = async (actor: IntegrationActor) => {
    const authResult = await actor.client.auth.getUser();
    if (authResult.error || authResult.data.user?.id !== actor.user.id) {
      throw new Error("Authenticated client and mocked action identity do not match.");
    }
    const nextActor: ActionActor = {
      user: actor.user,
      profile: actor.profile,
      client: actor.client,
    };
    runtime.setActor(nextActor);
  };

  return integrationRuntime;
}

export function installIntegrationActionRuntimeMocks(
  runtime: ReturnType<typeof createIntegrationActionRuntime>,
): void {
  mock.module("next/cache", {
    namedExports: {
      revalidatePath: runtime.revalidatePath,
      unstable_cache: runtime.unstableCache,
    },
  });
  mock.module("next/navigation", {
    namedExports: { redirect: runtime.redirect },
  });
  mock.module("next/server", {
    namedExports: { after: runtime.after },
  });
  mock.module("@/lib/auth/session", {
    namedExports: {
      requireAuthUser: runtime.requireAuthUser,
      requireProfile: runtime.requireProfile,
    },
  });
  mock.module("@/lib/supabase/server", {
    namedExports: { createClient: runtime.createClient },
  });
  mock.module("@/lib/events/log", {
    namedExports: { logUserEvent: runtime.logUserEvent },
  });
}
