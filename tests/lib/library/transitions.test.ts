import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyLibraryStateTransitions } from "@/lib/library/transitions";

describe("applyLibraryStateTransitions", () => {
  it("moves plan-to-watch entries with progress into watching", () => {
    const patch = applyLibraryStateTransitions({
      existingStatus: "plan_to_watch",
      existingProgressEpisodes: 0,
      patch: { progressEpisodes: 1 },
      totalEpisodes: 12,
    });

    assert.equal(patch.status, "watching");
    assert.equal(patch.progressEpisodes, 1);
  });

  it("completes watching entries when progress reaches the known total", () => {
    const patch = applyLibraryStateTransitions({
      existingStatus: "watching",
      existingProgressEpisodes: 11,
      patch: { progressEpisodes: 12 },
      totalEpisodes: 12,
    });

    assert.equal(patch.status, "completed");
    assert.equal(patch.progressEpisodes, 12);
  });

  it("completes paused entries when progress reaches the known total", () => {
    const patch = applyLibraryStateTransitions({
      existingStatus: "paused",
      existingProgressEpisodes: 11,
      patch: { progressEpisodes: 12 },
      totalEpisodes: 12,
    });

    assert.equal(patch.status, "completed");
    assert.equal(patch.progressEpisodes, 12);
  });

  it("does not complete dropped entries just because progress reaches total", () => {
    const patch = applyLibraryStateTransitions({
      existingStatus: "dropped",
      existingProgressEpisodes: 11,
      patch: { progressEpisodes: 12 },
      totalEpisodes: 12,
    });

    assert.equal(patch.status, undefined);
    assert.equal(patch.progressEpisodes, 12);
  });

  it("sets completed entries to the known episode total", () => {
    const patch = applyLibraryStateTransitions({
      existingStatus: "watching",
      existingProgressEpisodes: 3,
      patch: { status: "completed" },
      totalEpisodes: 12,
    });

    assert.equal(patch.status, "completed");
    assert.equal(patch.progressEpisodes, 12);
  });

  it("leaves completed progress alone when the total is unknown", () => {
    const patch = applyLibraryStateTransitions({
      existingStatus: "watching",
      existingProgressEpisodes: 3,
      patch: { status: "completed" },
      totalEpisodes: null,
    });

    assert.equal(patch.status, "completed");
    assert.equal(patch.progressEpisodes, undefined);
  });
});
