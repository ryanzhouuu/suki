import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children and defaults to the primary variant", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    assert.match(button.className, /bg-accent/);
    cleanup();
  });

  it("applies the requested variant and size classes", () => {
    render(
      <Button variant="danger" size="sm">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    assert.match(button.className, /text-danger/);
    assert.match(button.className, /text-xs/);
    cleanup();
  });

  it("fires onClick when enabled and not when disabled", () => {
    let clicks = 0;
    render(<Button onClick={() => (clicks += 1)}>Click me</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    assert.equal(clicks, 1);
    cleanup();

    render(
      <Button disabled onClick={() => (clicks += 1)}>
        Click me
      </Button>,
    );
    const disabledButton = screen.getByRole("button", { name: "Click me" });
    assert.equal(disabledButton.hasAttribute("disabled"), true);
    fireEvent.click(disabledButton);
    assert.equal(clicks, 1);
    cleanup();
  });
});
