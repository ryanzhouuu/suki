import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { Label } from "@/components/ui/label";

describe("Label", () => {
  it("renders children and associates with a control via htmlFor", () => {
    render(
      <>
        <Label htmlFor="genre">Genre</Label>
        <input id="genre" />
      </>,
    );
    const label = screen.getByText("Genre");
    assert.equal(label.tagName, "LABEL");
    assert.equal(label.getAttribute("for"), "genre");
    cleanup();
  });

  it("merges a custom className with the defaults", () => {
    render(<Label className="extra">Genre</Label>);
    const label = screen.getByText("Genre");
    assert.match(label.className, /extra/);
    assert.match(label.className, /uppercase/);
    cleanup();
  });
});
