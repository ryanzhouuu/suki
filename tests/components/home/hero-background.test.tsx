import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render } from "@testing-library/react";

import { HeroBackground } from "@/components/home/hero-background";

describe("HeroBackground", () => {
  // The populated-src branch renders next/image with a real URL; next/image's
  // URL/host validation only works inside the real Next.js build pipeline and
  // throws under a bare React test renderer (happy-dom's URL parser included)
  // regardless of the URL given, so that branch isn't covered here.
  it("renders nothing when src is empty", () => {
    const { container } = render(<HeroBackground src="" variant="card" />);
    assert.equal(container.firstChild, null);
    cleanup();
  });
});
