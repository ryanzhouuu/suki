import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import type * as AsyncSectionType from "@/components/ui/async-section";

let AsyncSectionEmpty: typeof AsyncSectionType.AsyncSectionEmpty;
let AsyncSectionUnavailable: typeof AsyncSectionType.AsyncSectionUnavailable;

before(async () => {
  mock.module("next/navigation", {
    namedExports: { useRouter: () => ({ refresh: () => {} }) },
  });
  ({ AsyncSectionEmpty, AsyncSectionUnavailable } = await import(
    "@/components/ui/async-section"
  ));
});

describe("async section states", () => {
  afterEach(cleanup);

  it("renders a successful empty state without a retry", () => {
    render(
      <AsyncSectionEmpty
        description="Add a friend to see their updates."
        title="No activity yet"
      />,
    );
    screen.getByRole("status");
    screen.getByText("No activity yet");
    screen.getByText("Add a friend to see their updates.");
    assertNoRetry();
  });

  it("renders a retry and reference for a retryable failure", () => {
    render(
      <AsyncSectionUnavailable
        description="Friend activity is temporarily unavailable."
        referenceId="abc12345"
        retryable
        title="Couldn't load activity"
      />,
    );
    screen.getByRole("status");
    screen.getByText("Couldn't load activity");
    screen.getByText("Reference: abc12345");
    screen.getByRole("button", { name: "Try again" });
  });

  it("does not offer a misleading retry for a non-retryable failure", () => {
    render(
      <AsyncSectionUnavailable
        description="Recommendations are unavailable."
        title="Couldn't load recommendations"
      />,
    );
    screen.getByText("Couldn't load recommendations");
    assertNoRetry();
  });
});

function assertNoRetry() {
  if (screen.queryByRole("button", { name: "Try again" })) {
    throw new Error("Expected retry action to be absent");
  }
}
