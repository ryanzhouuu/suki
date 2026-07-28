import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { BrandLockup, BrandMark } from "@/components/brand/brand-mark";

describe("BrandMark", () => {
  afterEach(cleanup);

  it("is decorative by default", () => {
    const { container } = render(<BrandMark />);
    assert.equal(container.querySelector("svg")?.getAttribute("aria-hidden"), "true");
    assert.equal(screen.queryByRole("img"), null);
  });

  it("can expose an accessible label", () => {
    render(<BrandMark label="Suki stamp" />);
    screen.getByRole("img", { name: "Suki stamp" });
  });

  it("pairs the stamp with the Suki wordmark", () => {
    render(<BrandLockup />);
    screen.getByText("Suki");
  });
});
