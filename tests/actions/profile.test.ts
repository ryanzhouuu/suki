import assert from "node:assert/strict";
import { before, describe, it, mock } from "node:test";

const redirectCalls: string[] = [];

mock.module("next/navigation", {
  namedExports: {
    redirect: (path: string) => {
      redirectCalls.push(path);
      throw new Error(`REDIRECT:${path}`);
    },
  },
});

mock.module("next/cache", {
  namedExports: {
    revalidatePath: () => {},
  },
});

mock.module("@/lib/auth/session", {
  namedExports: {
    requireAuthUser: async () => ({ id: "user-1" }),
  },
});

mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({
      from: () => ({
        select: () => ({
          ilike: () => ({
            neq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }),
        insert: async () => ({ error: null }),
      }),
    }),
  },
});

let completeProfile: typeof import("@/actions/profile").completeProfile;

before(async () => {
  ({ completeProfile } = await import("@/actions/profile"));
});

describe("completeProfile", () => {
  it("redirects new users to library setup", async () => {
    const formData = new FormData();
    formData.set("username", "suki_fan");
    formData.set("display_name", "Suki Fan");

    await assert.rejects(
      () => completeProfile({}, formData),
      /REDIRECT:\/setup\/library/,
    );
    assert.deepEqual(redirectCalls, ["/setup/library"]);
  });
});
