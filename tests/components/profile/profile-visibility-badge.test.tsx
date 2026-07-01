import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { ProfileVisibilityBadge } from "@/components/profile/profile-visibility-badge";

describe("ProfileVisibilityBadge", () => {
  it("shows the label for each visibility level", () => {
    render(<ProfileVisibilityBadge visibility="public" />);
    screen.getByText("Public");
    cleanup();

    render(<ProfileVisibilityBadge visibility="friends_only" />);
    screen.getByText("Friends only");
    cleanup();

    render(<ProfileVisibilityBadge visibility="private" />);
    screen.getByText("Private");
    cleanup();
  });
});
