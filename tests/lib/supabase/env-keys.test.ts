import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getSupabasePublishableKey } from "@/lib/supabase/env-keys";

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
});

describe("getSupabasePublishableKey", () => {
  it("returns publishable key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(getSupabasePublishableKey(), "sb_publishable_test");
  });

  it("falls back to legacy anon key", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-anon";
    assert.equal(getSupabasePublishableKey(), "legacy-anon");
  });

  it("throws when missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.throws(() => getSupabasePublishableKey(), /PUBLISHABLE/);
  });
});
