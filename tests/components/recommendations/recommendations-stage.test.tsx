import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { RecommendationsStage } from "@/components/recommendations/recommendations-stage";

describe("RecommendationsStage", () => {
  it("renders children, leading, and trailing content", () => {
    render(
      <RecommendationsStage leading={<span>Leading</span>} trailing={<span>Trailing</span>}>
        <p>Main content</p>
      </RecommendationsStage>,
    );
    screen.getByText("Leading");
    screen.getByText("Main content");
    screen.getByText("Trailing");
    cleanup();
  });

  it("renders without leading/trailing content", () => {
    render(
      <RecommendationsStage>
        <p>Main content</p>
      </RecommendationsStage>,
    );
    screen.getByText("Main content");
    cleanup();
  });
});
