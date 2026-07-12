import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { RouteSkeleton, SkeletonBlock } from "@/components/ui/route-skeleton";

describe("RouteSkeleton", () => {
  afterEach(cleanup);

  it("announces loading while hiding decorative placeholders", () => {
    const { container } = render(
      <RouteSkeleton label="Loading library">
        <SkeletonBlock className="h-12" />
      </RouteSkeleton>,
    );

    screen.getByRole("status");
    screen.getByText("Loading library");
    assert.equal(container.querySelector("button, a, input"), null);
    assert.ok(container.querySelector('[aria-hidden="true"]'));
  });
});
