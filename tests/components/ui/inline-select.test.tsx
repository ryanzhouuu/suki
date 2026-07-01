import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { InlineSelect } from "@/components/ui/inline-select";

const options = [
  { value: "score", label: "Score" },
  { value: "title", label: "Title" },
];

describe("InlineSelect", () => {
  it("shows the selected option's label and hides the listbox until opened", () => {
    render(<InlineSelect value="score" options={options} onChange={() => {}} />);
    assert.equal(screen.getByRole("button").textContent?.includes("Score"), true);
    assert.equal(screen.queryByRole("listbox"), null);
    cleanup();
  });

  it("opens the listbox and reports the chosen value", () => {
    let selected = "score";
    render(
      <InlineSelect
        value={selected}
        options={options}
        onChange={(next) => (selected = next)}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: "Title" }));
    assert.equal(selected, "title");
    cleanup();
  });

  it("mirrors the value into a hidden input when name is provided", () => {
    render(
      <InlineSelect value="score" options={options} onChange={() => {}} name="sort" />,
    );
    const hidden = document.querySelector('input[type="hidden"][name="sort"]');
    assert.equal(hidden?.getAttribute("value"), "score");
    cleanup();
  });
});
