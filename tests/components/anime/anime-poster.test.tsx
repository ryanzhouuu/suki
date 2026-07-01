import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { AnimePoster } from "@/components/anime/anime-poster";

describe("AnimePoster", () => {
  it("renders an image with alt text and size dimensions when src is set", () => {
    render(<AnimePoster src="https://example.com/cover.jpg" alt="Naruto" size="lg" />);
    const img = screen.getByAltText("Naruto");
    assert.equal(img.getAttribute("width"), "120");
    assert.equal(img.getAttribute("height"), "171");
    cleanup();
  });

  it("renders a placeholder block with no image when src is null", () => {
    render(<AnimePoster src={null} alt="Naruto" size="md" />);
    assert.equal(screen.queryByAltText("Naruto"), null);
    cleanup();
  });

  it("renders an empty fill container when fill is true and src is null", () => {
    render(<AnimePoster src={null} alt="Naruto" fill />);
    assert.equal(screen.queryByAltText("Naruto"), null);
    cleanup();
  });
});
