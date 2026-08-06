import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatProfile,
  lengthProfile,
  neutralProfile,
  qualifies,
  statusProfile,
} from "./rule-fixtures";

describe("format and behavior rule boundaries", () => {
  it("requires sixty-five percent short completions", () => {
    const profile = (short: number) =>
      lengthProfile(Array.from({ length: 20 }, (_, index) => (index < short ? 12 : 20)));
    assert.equal(qualifies(profile(12), "short-form-loyalist"), false);
    assert.equal(qualifies(profile(13), "short-form-loyalist"), true);
    assert.equal(qualifies(profile(14), "short-form-loyalist"), true);
  });

  it("requires three long franchises and their episode share", () => {
    const below = lengthProfile([42, 42, 42, 38, 38, 39, 39, 39]);
    const exact = lengthProfile([42, 42, 42, 38, 38, 39, 39]);
    const above = lengthProfile([42, 42, 42, 38, 39]);
    assert.equal(qualifies(below, "long-haul-legend"), false);
    assert.equal(qualifies(exact, "long-haul-legend"), true);
    assert.equal(qualifies(above, "long-haul-legend"), true);
  });

  it("requires three movies among at least four known formats", () => {
    assert.equal(qualifies(formatProfile(2, 4), "movie-night-regular"), false);
    assert.equal(qualifies(formatProfile(3, 4), "movie-night-regular"), true);
    assert.equal(qualifies(formatProfile(4, 4), "movie-night-regular"), true);
  });

  it("requires ten started franchises for completion behavior", () => {
    const profile = (count: number) =>
      statusProfile(Array.from({ length: count }, () => "completed" as const));
    assert.equal(qualifies(profile(9), "completion-machine"), false);
    assert.equal(qualifies(profile(10), "completion-machine"), true);
    assert.equal(qualifies(profile(11), "completion-machine"), true);
  });

  it("requires a thirty-five percent pause or drop share", () => {
    const profile = (paused: number, completed: number) =>
      statusProfile([
        ...Array.from({ length: paused }, () => "paused" as const),
        ...Array.from({ length: completed }, () => "completed" as const),
      ]);
    assert.equal(qualifies(profile(6, 14), "serial-sampler"), false);
    assert.equal(qualifies(profile(7, 13), "serial-sampler"), true);
    assert.equal(qualifies(profile(8, 12), "serial-sampler"), true);
  });

  it("requires four rewatches across two franchises", () => {
    const profile = (counts: number[]) => {
      const input = neutralProfile(counts.length);
      counts.forEach((count, index) => {
        input.entries[index].rewatch_count = count;
      });
      return input;
    };
    assert.equal(qualifies(profile([2, 1, 0]), "rewatch-ritualist"), false);
    assert.equal(qualifies(profile([2, 2, 0]), "rewatch-ritualist"), true);
    assert.equal(qualifies(profile([2, 2, 1]), "rewatch-ritualist"), true);
  });
});
