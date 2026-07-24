import assert from "node:assert/strict";
import test from "node:test";

import {
  getLatestCompletedWeek,
  isDigestWindowEligible,
  utcRangeForLocalDates,
} from "@/lib/digest/window";

test("calculates the previous completed local week", () => {
  const chicago = getLatestCompletedWeek(
    new Date("2026-11-05T18:00:00Z"),
    "America/Chicago",
  );
  assert.equal(chicago.weekStart, "2026-10-26");
  assert.equal(chicago.weekEnd, "2026-11-02");
  assert.equal(chicago.startUtc, "2026-10-26T05:00:00.000Z");
  assert.equal(chicago.endUtc, "2026-11-02T06:00:00.000Z");
});

test("reconstructs exact UTC boundaries for a stored local week", () => {
  assert.deepEqual(
    utcRangeForLocalDates(
      "2026-10-26",
      "2026-11-02",
      "America/Chicago",
    ),
    {
      startUtc: "2026-10-26T05:00:00.000Z",
      endUtc: "2026-11-02T06:00:00.000Z",
    },
  );
});

test("handles year boundaries and falls back to UTC", () => {
  const window = getLatestCompletedWeek(
    new Date("2027-01-04T00:30:00Z"),
    "not-a-zone",
  );
  assert.equal(window.timezone, "UTC");
  assert.equal(window.weekStart, "2026-12-28");
  assert.equal(window.weekEnd, "2027-01-04");
});

test("requires a full week after metadata launch", () => {
  assert.equal(
    isDigestWindowEligible(
      getLatestCompletedWeek(new Date("2026-08-03T12:00:00Z"), "UTC"),
    ),
    true,
  );
  assert.equal(
    isDigestWindowEligible(
      getLatestCompletedWeek(new Date("2026-07-27T12:00:00Z"), "UTC"),
    ),
    false,
  );
});
