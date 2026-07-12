import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { ResilienceRetry as ResilienceRetryType } from "@/components/ui/resilience-retry";

const router = { refresh: mock.fn() };
let ResilienceRetry: typeof ResilienceRetryType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: { useRouter: () => router },
  });
  ({ ResilienceRetry } = await import("@/components/ui/resilience-retry"));
});

describe("ResilienceRetry", () => {
  afterEach(() => {
    cleanup();
    router.refresh.mock.resetCalls();
  });

  it("refreshes the current route once when selected", () => {
    render(<ResilienceRetry />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    assert.equal(router.refresh.mock.callCount(), 1);
  });

  it("supports contextual retry copy", () => {
    render(<ResilienceRetry label="Reload activity" />);
    screen.getByRole("button", { name: "Reload activity" });
  });
});
