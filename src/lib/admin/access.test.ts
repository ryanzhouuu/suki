import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { isSeriesAdminEmail } from "./access";

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
});

describe("isSeriesAdminEmail", () => {
  it("returns false when env empty or email missing", () => {
    process.env.SERIES_ADMIN_EMAILS = "";
    assert.equal(isSeriesAdminEmail(null), false);
    assert.equal(isSeriesAdminEmail("admin@example.com"), false);
  });

  it("matches listed emails case-insensitively", () => {
    process.env.SERIES_ADMIN_EMAILS = "Admin@Example.com, other@test.io";
    assert.equal(isSeriesAdminEmail("admin@example.com"), true);
    assert.equal(isSeriesAdminEmail("OTHER@test.io"), true);
    assert.equal(isSeriesAdminEmail("nope@test.io"), false);
  });
});
