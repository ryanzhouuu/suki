import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

// `secret-key.ts` starts with `import "server-only"`, which throws outside a
// react-server module context. The unit test runner doesn't set that
// condition (unlike `next build` or the `--conditions=react-server` CLI
// scripts), so stub the marker package before dynamically importing the
// module under test — mirrors the `mock.module` pattern used for
// `@/actions/*` elsewhere in this suite.
mock.module("server-only", { namedExports: {} });

let getSupabaseSecretKey: typeof import("@/lib/supabase/secret-key").getSupabaseSecretKey;

before(async () => {
  ({ getSupabaseSecretKey } = await import("@/lib/supabase/secret-key"));
});

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
});

describe("getSupabaseSecretKey", () => {
  it("returns secret key", () => {
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal(getSupabaseSecretKey(), "sb_secret_test");
  });

  it("throws when missing", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.throws(() => getSupabaseSecretKey(), /SECRET/);
  });
});
