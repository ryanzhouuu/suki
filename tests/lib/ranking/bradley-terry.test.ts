import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  betaToScore,
  confidenceFromUncertainty,
  expectedProb,
  fitBradleyTerry,
} from "@/lib/ranking/bradley-terry";
import type { ResolvedComparison } from "@/lib/ranking/preference-graph";

function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

describe("fitBradleyTerry", () => {
  it("is independent of comparison order", () => {
    const ids = ["a", "b", "c", "d"];
    const edges: ResolvedComparison[] = [
      { winnerId: "a", loserId: "b" },
      { winnerId: "b", loserId: "c" },
      { winnerId: "c", loserId: "d" },
      { winnerId: "a", loserId: "c" },
      { winnerId: "b", loserId: "d" },
    ];

    const base = fitBradleyTerry(ids, edges);
    const shuffled = fitBradleyTerry(ids, shuffle(edges, 7));

    for (const id of ids) {
      assert.ok(
        Math.abs(base.get(id)!.beta - shuffled.get(id)!.beta) < 1e-6,
        `beta for ${id} should match regardless of edge order`,
      );
    }
  });

  it("recovers transitive order without a direct comparison", () => {
    // a beats b, b beats c — a should outrank c with no a-vs-c edge.
    const result = fitBradleyTerry(
      ["a", "b", "c"],
      [
        { winnerId: "a", loserId: "b" },
        { winnerId: "b", loserId: "c" },
      ],
    );

    assert.ok(result.get("a")!.beta > result.get("b")!.beta);
    assert.ok(result.get("b")!.beta > result.get("c")!.beta);
  });

  it("keeps strengths finite for disconnected entities", () => {
    const result = fitBradleyTerry(
      ["a", "b", "c", "d"],
      [{ winnerId: "a", loserId: "b" }],
    );

    for (const id of ["a", "b", "c", "d"]) {
      assert.ok(Number.isFinite(result.get(id)!.beta));
    }
    // c and d have no comparisons — they stay at the baseline.
    assert.equal(result.get("c")!.beta, 0);
    assert.equal(result.get("d")!.beta, 0);
    assert.equal(result.get("c")!.comparisonCount, 0);
  });

  it("keeps strengths finite for an always-winning entity", () => {
    const result = fitBradleyTerry(
      ["a", "b", "c", "d"],
      [
        { winnerId: "a", loserId: "b" },
        { winnerId: "a", loserId: "c" },
        { winnerId: "a", loserId: "d" },
      ],
    );

    assert.ok(Number.isFinite(result.get("a")!.beta));
    assert.ok(result.get("a")!.beta > result.get("b")!.beta);
  });

  it("ranks the winner above the loser (monotonicity)", () => {
    const result = fitBradleyTerry(
      ["a", "b"],
      [{ winnerId: "a", loserId: "b" }],
    );

    assert.ok(result.get("a")!.beta > 0);
    assert.ok(result.get("b")!.beta < 0);
  });

  it("reports lower uncertainty for more-compared entities", () => {
    const result = fitBradleyTerry(
      ["a", "b", "c", "d"],
      [
        { winnerId: "a", loserId: "b" },
        { winnerId: "a", loserId: "c" },
        { winnerId: "a", loserId: "d" },
      ],
    );

    // a has 3 comparisons, b has 1 — a should be more certain.
    assert.equal(result.get("a")!.comparisonCount, 3);
    assert.equal(result.get("b")!.comparisonCount, 1);
    assert.ok(result.get("a")!.uncertainty < result.get("b")!.uncertainty);
  });

  it("ignores edges referencing unranked entities", () => {
    const result = fitBradleyTerry(
      ["a", "b"],
      [
        { winnerId: "a", loserId: "b" },
        { winnerId: "a", loserId: "ghost" },
      ],
    );

    assert.equal(result.size, 2);
    assert.equal(result.get("a")!.comparisonCount, 1);
  });
});

describe("confidenceFromUncertainty", () => {
  it("maps each band to the right label", () => {
    assert.equal(confidenceFromUncertainty(0.5), "high");
    assert.equal(confidenceFromUncertainty(1.5), "high");
    assert.equal(confidenceFromUncertainty(3), "medium");
    assert.equal(confidenceFromUncertainty(5), "medium");
    assert.equal(confidenceFromUncertainty(7.2), "low");
    assert.equal(confidenceFromUncertainty(33), "low");
  });

  it("is exclusive at each band's upper boundary", () => {
    assert.equal(confidenceFromUncertainty(1.51), "medium");
    assert.equal(confidenceFromUncertainty(5.01), "low");
  });
});

describe("expectedProb / betaToScore", () => {
  it("is 0.5 at equal strength and 1500 at baseline", () => {
    assert.equal(expectedProb(0, 0), 0.5);
    assert.equal(betaToScore(0), 1500);
  });

  it("matches the Elo display formula under the affine map", () => {
    const betaA = 0.6;
    const betaB = -0.2;
    const scoreA = betaToScore(betaA);
    const scoreB = betaToScore(betaB);
    const eloForm = 1 / (1 + 10 ** (-(scoreA - scoreB) / 400));

    assert.ok(Math.abs(expectedProb(betaA, betaB) - eloForm) < 1e-12);
  });
});
