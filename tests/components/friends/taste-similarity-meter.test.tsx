import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { TasteSimilarityMeter } from "@/components/friends/taste-similarity-meter";
import type { TasteSimilarityResult } from "@/lib/friends/taste-similarity";

describe("TasteSimilarityMeter", () => {
  it("renders the score, label, and confidence copy when ready", () => {
    const similarity: TasteSimilarityResult = {
      status: "ready",
      score: 74,
      label: "Strong match",
      confidence: "medium",
    };
    render(
      <TasteSimilarityMeter similarity={similarity} friendDisplayName="Alex" />,
    );
    screen.getByText("74");
    screen.getByText("Strong match");
    screen.getByText("Based on your libraries and rankings — still refining.");
    cleanup();
  });

  it("shows an unavailable message naming the friend when data is insufficient", () => {
    const similarity: TasteSimilarityResult = {
      status: "unavailable",
      reason: "insufficient_data",
    };
    render(
      <TasteSimilarityMeter similarity={similarity} friendDisplayName="Alex" />,
    );
    screen.getByText("Taste match unavailable");
    screen.getByText(/Ask Alex to do the same/);
    cleanup();
  });

  it("shows the not-configured message", () => {
    const similarity: TasteSimilarityResult = {
      status: "unavailable",
      reason: "not_configured",
    };
    render(
      <TasteSimilarityMeter similarity={similarity} friendDisplayName="Alex" />,
    );
    screen.getByText(/OPENAI_API_KEY/);
    cleanup();
  });
});
