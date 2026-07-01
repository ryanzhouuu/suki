import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { RecommendationBannerBackdrop } from "@/components/recommendations/recommendation-banner-backdrop";

describe("RecommendationBannerBackdrop", () => {
  it("prefers the banner URL over the cover URL", () => {
    render(
      <RecommendationBannerBackdrop
        bannerUrl="banner.jpg"
        coverUrl="cover.jpg"
      />,
    );
    assert.equal(screen.getByAltText("").getAttribute("src"), "banner.jpg");
    cleanup();
  });

  it("falls back to the cover URL when there's no banner", () => {
    render(<RecommendationBannerBackdrop bannerUrl={null} coverUrl="cover.jpg" />);
    assert.equal(screen.getByAltText("").getAttribute("src"), "cover.jpg");
    cleanup();
  });

  it("renders a gradient placeholder with no image when both are null", () => {
    const { container } = render(
      <RecommendationBannerBackdrop bannerUrl={null} coverUrl={null} />,
    );
    assert.equal(container.querySelector("img"), null);
    cleanup();
  });
});
