import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { FilterMatchCount } from "@/components/filters/filter-match-count";

describe("FilterMatchCount", () => {
  it("pluralizes the noun when total is not 1", () => {
    render(<FilterMatchCount matched={3} total={10} noun="show" />);
    screen.getByText("3 of 10 shows match");
    cleanup();
  });

  it("keeps the noun singular when total is 1", () => {
    render(<FilterMatchCount matched={1} total={1} noun="show" />);
    screen.getByText("1 of 1 show match");
    cleanup();
  });

  it("pluralizes even when nothing matched", () => {
    render(<FilterMatchCount matched={0} total={5} noun="entry" />);
    screen.getByText("0 of 5 entrys match");
    cleanup();
  });
});
