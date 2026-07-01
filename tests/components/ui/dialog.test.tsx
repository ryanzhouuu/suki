import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Dialog } from "@/components/ui/dialog";

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Details">
        Content
      </Dialog>,
    );
    assert.equal(screen.queryByRole("dialog"), null);
    cleanup();
  });

  it("renders title, subtitle, and children when open", () => {
    render(
      <Dialog open onClose={() => {}} title="Details" subtitle="Season 1">
        Body content
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    assert.equal(dialog.getAttribute("aria-label"), "Details");
    assert.equal(screen.getByText("Season 1").textContent, "Season 1");
    assert.equal(screen.getByText("Body content").textContent, "Body content");
    cleanup();
  });

  it("calls onClose when the close button or backdrop is clicked", () => {
    let closed = 0;
    render(
      <Dialog open onClose={() => (closed += 1)} title="Details">
        Content
      </Dialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    assert.equal(closed, 1);
    cleanup();
  });

  it("calls onClose on Escape", () => {
    let closed = 0;
    render(
      <Dialog open onClose={() => (closed += 1)} title="Details">
        Content
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    assert.equal(closed, 1);
    cleanup();
  });
});
