import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { AnimeTrailer } from "@/components/anime/anime-trailer";

describe("AnimeTrailer", () => {
  afterEach(() => cleanup());

  it("shows the thumbnail without loading the player", () => {
    render(
      <AnimeTrailer
        id="abc123"
        thumbnail="https://img.youtube.com/vi/abc123/0.jpg"
      />,
    );

    assert.ok(screen.getByRole("button", { name: "Play trailer" }));
    assert.ok(screen.getByAltText("Trailer thumbnail"));
    assert.equal(screen.queryByTitle("Anime trailer"), null);
  });

  it("loads the in-page player after the thumbnail is clicked", () => {
    render(<AnimeTrailer id="abc 123" thumbnail={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Play trailer" }));

    const player = screen.getByTitle("Anime trailer");
    assert.equal(
      player.getAttribute("src"),
      "https://www.youtube-nocookie.com/embed/abc%20123?autoplay=1",
    );
    assert.equal(player.getAttribute("allowfullscreen"), "");
    assert.equal(screen.queryByRole("button", { name: "Play trailer" }), null);
  });
});
