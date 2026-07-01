import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { GenreFilter } from "@/components/filters/genre-filter";
import { ANILIST_GENRES } from "@/lib/anilist/genres";

describe("GenreFilter", () => {
  it("starts collapsed with a prompt when nothing is selected", () => {
    render(<GenreFilter selected={[]} onChange={() => {}} />);
    screen.getByText("Tap to filter by genre");
    assert.equal(screen.queryByRole("group", { name: "Filter by genre" }), null);
    cleanup();
  });

  it("starts expanded and shows the selection count when genres are selected", () => {
    render(<GenreFilter selected={["Action"]} onChange={() => {}} />);
    screen.getByRole("group", { name: "Filter by genre" });
    screen.getByText("· 1 selected");
    cleanup();
  });

  it("adds a genre on click and reports it via onChange", () => {
    let selected: string[] = [];
    render(
      <GenreFilter
        selected={selected}
        onChange={(next) => (selected = next)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Genres/ }));
    fireEvent.click(screen.getByRole("button", { name: ANILIST_GENRES[0] }));
    assert.deepEqual(selected, [ANILIST_GENRES[0]]);
    cleanup();
  });

  it("removes an already-selected genre on click", () => {
    let selected: string[] = [ANILIST_GENRES[0]];
    render(
      <GenreFilter
        selected={selected}
        onChange={(next) => (selected = next)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: ANILIST_GENRES[0] }));
    assert.deepEqual(selected, []);
    cleanup();
  });

  it("clears all selections via the Clear button", () => {
    let selected: string[] = ["Action", "Drama"];
    render(
      <GenreFilter
        selected={selected}
        onChange={(next) => (selected = next)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    assert.deepEqual(selected, []);
    cleanup();
  });
});
