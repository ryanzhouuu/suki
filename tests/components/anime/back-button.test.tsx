import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { BackButton as BackButtonType } from "@/components/anime/back-button";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();
let BackButton: typeof BackButtonType;

before(async () => {
  ({ BackButton } = await import("@/components/anime/back-button"));
});

describe("BackButton", () => {
  afterEach(() => cleanup());

  it("pushes the fallback href when there's no history to go back to", () => {
    Object.defineProperty(window.history, "length", {
      value: 1,
      configurable: true,
    });
    const calls: string[] = [];
    router.push = (href) => calls.push(`push:${href}`);
    router.back = () => calls.push("back");

    render(<BackButton fallbackHref="/library" />);
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    assert.deepEqual(calls, ["push:/library"]);
  });

  it("navigates back when history exists", () => {
    Object.defineProperty(window.history, "length", {
      value: 3,
      configurable: true,
    });
    const calls: string[] = [];
    router.push = (href) => calls.push(`push:${href}`);
    router.back = () => calls.push("back");

    render(<BackButton fallbackHref="/library" />);
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    assert.deepEqual(calls, ["back"]);
  });
});
