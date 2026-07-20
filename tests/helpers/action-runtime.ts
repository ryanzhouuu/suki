import { mock } from "node:test";

import type { User } from "@supabase/supabase-js";

import type { Json, Tables } from "@/types/database";

export type EventCall = {
  userId: string;
  eventType: string;
  animeId?: string;
  metadata?: Json;
};

export type ActionActor = {
  user: User | null;
  profile: Tables<"profiles"> | null;
  client: unknown;
};

export class ActionRedirectError extends Error {
  readonly destination: string;

  constructor(destination: string) {
    super(`REDIRECT:${destination}`);
    this.name = "ActionRedirectError";
    this.destination = destination;
  }
}

export function isActionRedirect(error: unknown): error is ActionRedirectError {
  return error instanceof ActionRedirectError;
}

export type ActionRuntime = {
  currentActor: ActionActor;
  revalidatedPaths: string[];
  redirectDestinations: string[];
  scheduledAfterCallbacks: Array<() => unknown>;
  eventCalls: EventCall[];
  pendingAsyncWork: Promise<unknown>[];
  setActor: (actor: Partial<ActionActor>) => void;
  resetCaptures: () => void;
  clearAfterCallbacks: () => void;
  flushAfterCallbacks: () => Promise<void>;
  trackPendingWork: (work: Promise<unknown>) => void;
  requireAuthUser: () => Promise<User>;
  requireProfile: () => Promise<{ user: User; profile: Tables<"profiles"> }>;
  createClient: () => Promise<unknown>;
  logUserEvent: (
    userId: string,
    eventType: string,
    options?: { animeId?: string; metadata?: Json },
  ) => Promise<void>;
  unstableCache: <A extends unknown[], T>(
    fn: (...args: A) => Promise<T>,
    keyParts?: string[],
    options?: { revalidate?: number | false; tags?: string[] },
  ) => (...args: A) => Promise<T>;
  revalidatePath: (path: string) => void;
  after: (callback: () => unknown) => void;
  redirect: (destination: string) => never;
};

export function createActionRuntime(): ActionRuntime {
  const runtime = {} as ActionRuntime;
  runtime.currentActor = { user: null, profile: null, client: {} };
  runtime.revalidatedPaths = [];
  runtime.redirectDestinations = [];
  runtime.scheduledAfterCallbacks = [];
  runtime.eventCalls = [];
  runtime.pendingAsyncWork = [];

  runtime.setActor = (actor) => {
    runtime.currentActor = {
      ...runtime.currentActor,
      ...actor,
    };
  };

  runtime.resetCaptures = () => {
    runtime.revalidatedPaths.length = 0;
    runtime.redirectDestinations.length = 0;
    runtime.eventCalls.length = 0;
    runtime.pendingAsyncWork.length = 0;
    runtime.clearAfterCallbacks();
  };

  runtime.clearAfterCallbacks = () => {
    runtime.scheduledAfterCallbacks.length = 0;
  };

  runtime.trackPendingWork = (work) => {
    runtime.pendingAsyncWork.push(work);
  };

  runtime.flushAfterCallbacks = async () => {
    let index = 0;
    while (index < runtime.scheduledAfterCallbacks.length) {
      const callback = runtime.scheduledAfterCallbacks[index++];
      await callback();
      if (runtime.pendingAsyncWork.length > 0) {
        const pending = runtime.pendingAsyncWork.splice(0);
        await Promise.all(pending);
      }
    }
    if (runtime.pendingAsyncWork.length > 0) {
      const pending = runtime.pendingAsyncWork.splice(0);
      await Promise.all(pending);
    }
  };

  runtime.requireAuthUser = async () => {
    if (!runtime.currentActor.user) return runtime.redirect("/auth/login");
    return runtime.currentActor.user;
  };

  runtime.requireProfile = async () => {
    const user = await runtime.requireAuthUser();
    if (!runtime.currentActor.profile) return runtime.redirect("/onboarding");
    return { user, profile: runtime.currentActor.profile };
  };

  runtime.createClient = async () => runtime.currentActor.client;

  runtime.logUserEvent = async (userId, eventType, options) => {
    runtime.eventCalls.push({ userId, eventType, ...options });
  };

  runtime.unstableCache = (fn) => fn;

  runtime.revalidatePath = (path) => {
    runtime.revalidatedPaths.push(path);
  };

  runtime.after = (callback) => {
    runtime.scheduledAfterCallbacks.push(callback);
  };

  runtime.redirect = (destination) => {
    runtime.redirectDestinations.push(destination);
    throw new ActionRedirectError(destination);
  };

  return runtime;
}

export function installActionRuntimeMocks(runtime: ActionRuntime): void {
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

export function assertRedirect(error: unknown, destination: string): void {
  if (!isActionRedirect(error) || error.destination !== destination) {
    throw new Error(`Expected redirect to ${destination}.`);
  }
}
