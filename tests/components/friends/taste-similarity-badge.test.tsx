import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { TasteSimilarityBadge } from "@/components/friends/taste-similarity-badge";
import type { TasteSimilarityResult } from "@/lib/friends/taste-similarity";

describe("TasteSimilarityBadge", () => {
  it("shows the score and match label when ready", () => {
    const similarity: TasteSimilarityResult = {
      status: "ready",
      score: 82,
      label: "Great match",
      confidence: "high",
    };
    render(<TasteSimilarityBadge similarity={similarity} />);
    screen.getByText("82%");
    screen.getByText("match");
    cleanup();
  });

  it("shows unavailable copy for insufficient data", () => {
    const similarity: TasteSimilarityResult = {
      status: "unavailable",
      reason: "insufficient_data",
    };
    render(<TasteSimilarityBadge similarity={similarity} />);
    screen.getByText("Need more data");
    cleanup();
  });

  it("shows a dash for non-friends", () => {
    const similarity: TasteSimilarityResult = {
      status: "unavailable",
      reason: "not_friends",
    };
    render(<TasteSimilarityBadge similarity={similarity} />);
    screen.getByText("—");
    cleanup();
  });
});
