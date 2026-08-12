import assert from "node:assert/strict";
import { before, describe, it, mock } from "node:test";

const rows = [
  {
    id: "entry-1",
    paused_at: "2026-07-01T00:00:00.000Z",
    anime: {
      anilist_id: 42,
      romaji_title: "Moonlit Couriers",
      english_title: null,
      cover_image_url: null,
    },
  },
  { id: "entry-without-anime", paused_at: null, anime: null },
];

const captured: Record<string, unknown> = {};

mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({
      from: () => ({
        select: () => ({
          eq(field: string, value: unknown) {
            captured[field] = value;
            return this;
          },
          lte(field: string, value: unknown) {
            captured[field] = value;
            return this;
          },
          order: async () => ({ data: rows, error: null }),
        }),
      }),
    }),
  },
});

let getDueInactivityPrompts: typeof import("@/lib/inactivity/queries").getDueInactivityPrompts;

before(async () => {
  ({ getDueInactivityPrompts } = await import("@/lib/inactivity/queries"));
});

describe("getDueInactivityPrompts", () => {
  it("loads only due paused entries and maps display metadata", async () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const prompts = await getDueInactivityPrompts("user-1", now);

    assert.equal(captured.user_id, "user-1");
    assert.equal(captured.status, "paused");
    assert.equal(captured.drop_prompt_due_at, now.toISOString());
    assert.deepEqual(prompts, [
      {
        id: "entry-1",
        pausedAt: "2026-07-01T00:00:00.000Z",
        anime: {
          anilistId: 42,
          title: "Moonlit Couriers",
          coverImageUrl: null,
        },
      },
    ]);
  });
});
