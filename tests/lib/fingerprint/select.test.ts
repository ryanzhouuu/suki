import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectFingerprintTraits } from "@/lib/fingerprint/select";
import type { FingerprintCandidate } from "@/lib/fingerprint/rules";

function candidate(
  id: FingerprintCandidate["id"],
  family: FingerprintCandidate["family"],
  strength: number,
  opposingTraitIds: FingerprintCandidate["opposingTraitIds"] = [],
): FingerprintCandidate {
  return {
    id,
    family,
    label: id,
    summary: `Summary for ${id}`,
    strength,
    opposingTraitIds,
    editorialPriority: 0,
    evidence: [
      { kind: "count", text: "Eight supporting franchises.", value: 8, denominator: 8 },
      { kind: "title", text: "A supporting title.", seriesIds: ["series-1"] },
    ],
  };
}

describe("selectFingerprintTraits", () => {
  it("uses stable strength, priority, and ID tie-breakers", () => {
    const traits = selectFingerprintTraits([
      candidate("focused-specialist", "breadth", 0.8, ["eclectic-explorer"]),
      candidate("eclectic-explorer", "breadth", 0.8, ["focused-specialist"]),
      candidate("battle-tested-favorites", "ranking", 0.8),
    ], 2);

    assert.deepEqual(
      traits.map((trait) => trait.id),
      ["battle-tested-favorites", "eclectic-explorer"],
    );
  });

  it("never returns opposing traits", () => {
    const traits = selectFingerprintTraits([
      candidate("focused-specialist", "breadth", 0.9, ["eclectic-explorer"]),
      candidate("eclectic-explorer", "breadth", 0.8, ["focused-specialist"]),
      candidate("heart-on-sleeve-rater", "rating", 0.7, ["reserved-applause"]),
      candidate("reserved-applause", "rating", 0.6, ["heart-on-sleeve-rater"]),
    ]);

    const selectedIds = traits.map((trait) => trait.id);
    assert.ok(selectedIds.includes("focused-specialist"));
    assert.ok(!selectedIds.includes("eclectic-explorer"));
    assert.ok(
      !(
        selectedIds.includes("heart-on-sleeve-rater") &&
        selectedIds.includes("reserved-applause")
      ),
    );
  });

  it("drops candidates without valid supporting evidence", () => {
    const invalid = candidate("genre-devotee", "content", 1);
    invalid.evidence = [{ kind: "count", text: "Only one fact." }];
    const traits = selectFingerprintTraits([
      invalid,
      candidate("rewatch-ritualist", "behavior", 0.4),
    ]);

    assert.deepEqual(traits.map((trait) => trait.id), ["rewatch-ritualist"]);
  });

  it("fills to five only with compatible candidates", () => {
    const traits = selectFingerprintTraits([
      candidate("genre-devotee", "content", 0.9),
      candidate("deep-cut-devotee", "discovery", 0.8),
      candidate("short-form-loyalist", "format", 0.7),
      candidate("completion-machine", "behavior", 0.6),
      candidate("heart-on-sleeve-rater", "rating", 0.5),
      candidate("battle-tested-favorites", "ranking", 0.4),
    ]);

    assert.equal(traits.length, 5);
    assert.deepEqual(
      traits.map((trait) => trait.id),
      [
        "genre-devotee",
        "deep-cut-devotee",
        "short-form-loyalist",
        "completion-machine",
        "heart-on-sleeve-rater",
      ],
    );
  });
});
