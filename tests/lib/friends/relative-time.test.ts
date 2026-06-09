import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatRelativeTime } from "@/lib/friends/relative-time";

const NOW = new Date("2026-06-09T12:00:00.000Z");

function ago(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString();
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

describe("formatRelativeTime", () => {
  it("shows 'just now' under a minute", () => {
    assert.equal(formatRelativeTime(ago(5 * SECOND), NOW), "just now");
    assert.equal(formatRelativeTime(ago(59 * SECOND), NOW), "just now");
  });

  it("shows whole minutes under an hour", () => {
    assert.equal(formatRelativeTime(ago(MINUTE), NOW), "1m ago");
    assert.equal(formatRelativeTime(ago(59 * MINUTE), NOW), "59m ago");
  });

  it("shows whole hours under a day", () => {
    assert.equal(formatRelativeTime(ago(HOUR), NOW), "1h ago");
    assert.equal(formatRelativeTime(ago(23 * HOUR), NOW), "23h ago");
  });

  it("shows whole days under a week", () => {
    assert.equal(formatRelativeTime(ago(DAY), NOW), "1d ago");
    assert.equal(formatRelativeTime(ago(6 * DAY), NOW), "6d ago");
  });

  it("shows whole weeks beyond a week", () => {
    assert.equal(formatRelativeTime(ago(WEEK), NOW), "1w ago");
    assert.equal(formatRelativeTime(ago(4 * WEEK), NOW), "4w ago");
  });

  it("clamps future timestamps to 'just now'", () => {
    assert.equal(formatRelativeTime(ago(-5 * MINUTE), NOW), "just now");
  });
});
