import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import {
  formatSupabaseOrigin,
  parseSupabaseOrigin,
} from "@/lib/security/supabase-origin";

describe("parseSupabaseOrigin", () => {
  it("preserves hosted HTTPS origins", () => {
    const origin = parseSupabaseOrigin("https://abcdefgh.supabase.co");
    assert.deepEqual(origin, {
      protocol: "https",
      hostname: "abcdefgh.supabase.co",
      port: "",
    });
    assert.equal(formatSupabaseOrigin(origin), "https://abcdefgh.supabase.co");
  });

  it("preserves the local HTTP port", () => {
    const origin = parseSupabaseOrigin("http://127.0.0.1:54321");
    assert.deepEqual(origin, {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "54321",
    });
    assert.equal(formatSupabaseOrigin(origin), "http://127.0.0.1:54321");
  });

  it("rejects unsupported protocols", () => {
    assert.throws(
      () => parseSupabaseOrigin("ftp://127.0.0.1:54321"),
      /must use http or https/,
    );
  });
});
