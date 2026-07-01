import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with default styling", () => {
    render(<Input placeholder="Search" />);
    const input = screen.getByPlaceholderText("Search");
    assert.match(input.className, /rounded-xl/);
    cleanup();
  });

  it("merges a custom className with the defaults", () => {
    render(<Input placeholder="Search" className="my-custom-class" />);
    const input = screen.getByPlaceholderText("Search");
    assert.match(input.className, /my-custom-class/);
    assert.match(input.className, /rounded-xl/);
    cleanup();
  });

  it("passes through value changes", () => {
    let value = "";
    render(
      <Input
        placeholder="Search"
        value={value}
        onChange={(event) => (value = event.target.value)}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "naruto" },
    });
    assert.equal(value, "naruto");
    cleanup();
  });
});
