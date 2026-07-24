import assert from "node:assert/strict";
import test from "node:test";

import { isValidTimeZone } from "@/lib/profiles/timezone";

test("accepts IANA timezones and UTC", () => {
  assert.equal(isValidTimeZone("America/Chicago"), true);
  assert.equal(isValidTimeZone("Asia/Tokyo"), true);
  assert.equal(isValidTimeZone("UTC"), true);
});

test("rejects invalid or oversized timezone values", () => {
  assert.equal(isValidTimeZone("Chicago"), false);
  assert.equal(isValidTimeZone(""), false);
  assert.equal(isValidTimeZone("x".repeat(101)), false);
});
