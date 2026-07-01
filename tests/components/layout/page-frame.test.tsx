import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import {
  BentoGrid,
  CinematicBackdrop,
  ControlRail,
  WidePageFrame,
} from "@/components/layout/page-frame";

describe("WidePageFrame", () => {
  it("renders children", () => {
    render(
      <WidePageFrame>
        <p>Content</p>
      </WidePageFrame>,
    );
    screen.getByText("Content");
    cleanup();
  });
});

describe("ControlRail", () => {
  it("labels the sidebar landmark and renders both sidebar and content", () => {
    render(
      <ControlRail sidebar={<p>Filters here</p>} sidebarLabel="My filters">
        <p>Main content</p>
      </ControlRail>,
    );
    screen.getByRole("complementary", { name: "My filters" });
    // Sidebar content renders twice (mobile <details> + desktop block).
    assert.equal(screen.getAllByText("Filters here").length, 2);
    screen.getByText("Main content");
    cleanup();
  });

  it("defaults the mobile details to closed", () => {
    const { container } = render(
      <ControlRail sidebar={<p>Filters</p>}>
        <p>Content</p>
      </ControlRail>,
    );
    const details = container.querySelector("details");
    assert.equal(details?.hasAttribute("open"), false);
    cleanup();
  });

  it("opens the mobile details when mobileDefaultOpen is set", () => {
    const { container } = render(
      <ControlRail sidebar={<p>Filters</p>} mobileDefaultOpen>
        <p>Content</p>
      </ControlRail>,
    );
    const details = container.querySelector("details");
    assert.equal(details?.hasAttribute("open"), true);
    cleanup();
  });
});

describe("CinematicBackdrop", () => {
  it("renders a gradient placeholder when imageUrl is null", () => {
    const { container } = render(<CinematicBackdrop imageUrl={null} />);
    assert.equal(container.querySelector("img"), null);
    cleanup();
  });

  it("renders an image when imageUrl is provided", () => {
    render(<CinematicBackdrop imageUrl="https://example.com/art.jpg" />);
    const img = screen.getByAltText("");
    assert.equal(img.getAttribute("src"), "https://example.com/art.jpg");
    cleanup();
  });
});

describe("BentoGrid", () => {
  it("renders children", () => {
    render(
      <BentoGrid>
        <p>Item</p>
      </BentoGrid>,
    );
    screen.getByText("Item");
    cleanup();
  });
});
