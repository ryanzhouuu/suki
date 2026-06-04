import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  changedLibraryFields,
  validateLibraryEntryPatch,
} from "@/lib/library/validate";

describe("validateLibraryEntryPatch", () => {
  it("accepts valid rich fields", () => {
    const patch = validateLibraryEntryPatch(
      {
        personalScore: 8.5,
        notes: "  Great soundtrack  ",
        startedAt: "2024-01-01",
        completedAt: "2024-02-01",
        priority: "high",
        rewatchCount: 1,
        progressEpisodes: 12,
      },
      { maxEpisodes: 24 },
    );

    assert.equal(patch.personalScore, 8.5);
    assert.equal(patch.notes, "Great soundtrack");
    assert.equal(patch.startedAt, "2024-01-01");
    assert.equal(patch.completedAt, "2024-02-01");
    assert.equal(patch.priority, "high");
    assert.equal(patch.rewatchCount, 1);
    assert.equal(patch.progressEpisodes, 12);
  });

  it("rejects invalid personal score", () => {
    assert.throws(
      () => validateLibraryEntryPatch({ personalScore: 11 }),
      /between 0 and 10/i,
    );
  });

  it("rejects progress beyond episode count", () => {
    assert.throws(
      () =>
        validateLibraryEntryPatch({ progressEpisodes: 30 }, { maxEpisodes: 12 }),
      /cannot exceed 12/i,
    );
  });

  it("rejects completed date before started date", () => {
    assert.throws(
      () =>
        validateLibraryEntryPatch({
          startedAt: "2024-05-01",
          completedAt: "2024-01-01",
        }),
      /before started date/i,
    );
  });

  it("clears notes to null when empty", () => {
    const patch = validateLibraryEntryPatch({ notes: "   " });
    assert.equal(patch.notes, null);
  });
});

describe("changedLibraryFields", () => {
  it("maps patch keys to database field names", () => {
    const fields = changedLibraryFields(
      {
        status: "watching",
        progress_episodes: 1,
        notes: null,
        personal_score: null,
        started_at: null,
        completed_at: null,
        priority: null,
        rewatch_count: 0,
      },
      {
        notes: "Remember the ending",
        personalScore: 9,
      },
    );

    assert.deepEqual(fields.sort(), ["notes", "personal_score"]);
  });
});
