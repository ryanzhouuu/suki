import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { DiscoverRow } from "@/components/home/discover-row";
import type { DiscoverAnimeItem } from "@/lib/anilist/discover";

function makeItem(overrides: Partial<DiscoverAnimeItem> = {}): DiscoverAnimeItem {
  return {
    anilistId: 20,
    title: "Naruto",
    coverUrl: null,
    format: "TV",
    seasonYear: 2002,
    ...overrides,
  };
}

describe("DiscoverRow", () => {
  afterEach(() => cleanup());

  it("renders nothing when there are no items", () => {
    const { container } = render(
      <DiscoverRow title="Trending" items={[]} />,
    );
    assert.equal(container.firstChild, null);
  });

  it("shows the title, eyebrow, and each item with a meta line", () => {
    render(
      <DiscoverRow
        title="Trending now"
        eyebrow="Discover"
        items={[makeItem({ anilistId: 1, title: "Naruto" }), makeItem({ anilistId: 2, title: "One Piece" })]}
      />,
    );
    screen.getByRole("heading", { name: "Trending now" });
    screen.getByText("Discover");
    screen.getByText("Naruto");
    screen.getByText("One Piece");
    assert.equal(screen.getAllByText("TV · 2002").length, 2);
  });

  it("links each item to its anime detail page", () => {
    render(<DiscoverRow title="Trending" items={[makeItem({ anilistId: 42 })]} />);
    const link = screen.getByRole("link", { name: /Naruto/ });
    assert.equal(link.getAttribute("href"), "/anime/42");
  });

  it("has left/right scroll buttons that don't throw when clicked", () => {
    render(<DiscoverRow title="Trending" items={[makeItem()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Scroll left" }));
    fireEvent.click(screen.getByRole("button", { name: "Scroll right" }));
  });
});
