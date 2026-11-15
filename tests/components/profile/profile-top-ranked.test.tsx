import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { ProfileTopRanked } from "@/components/profile/profile-top-ranked";

function makeSeries(rank: number) {
  return {
    id: `series-${rank}`,
    rank,
    title: `Series ${rank}`,
    anilistId: 100 + rank,
    coverUrl: null,
  };
}

describe("ProfileTopRanked", () => {
  afterEach(() => cleanup());

  it("renders nothing without ranked series", () => {
    const { container } = render(<ProfileTopRanked series={[]} />);
    assert.equal(container.firstChild, null);
  });

  it("shows at most five series, each linked with its rank", () => {
    render(<ProfileTopRanked series={[1, 2, 3, 4, 5, 6].map(makeSeries)} />);
    screen.getByRole("heading", { name: "Top five" });
    assert.equal(screen.getAllByRole("listitem").length, 5);
    assert.equal(screen.queryByText("Series 6"), null);
    const first = screen.getByRole("link", { name: /Rank 1\. Series 1/ });
    assert.equal(first.getAttribute("href"), "/anime/101");
  });

  it("titles a short list as top ranked", () => {
    render(<ProfileTopRanked series={[makeSeries(1), makeSeries(2)]} />);
    screen.getByRole("heading", { name: "Top ranked" });
  });
});
