import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ProfileTabs, type ProfileTab } from "@/components/profile/profile-tabs";

function makeTabs(): ProfileTab[] {
  return [
    { id: "anime", label: "Anime", count: 42, content: <p>Anime content</p> },
    { id: "activity", label: "Activity", count: null, content: <p>Activity content</p> },
  ];
}

describe("ProfileTabs", () => {
  it("shows the first tab's content by default", () => {
    render(<ProfileTabs tabs={makeTabs()} />);
    screen.getByText("Anime content");
    assert.equal(screen.queryByText("Activity content"), null);
    cleanup();
  });

  it("shows the count badge only when count is a number", () => {
    render(<ProfileTabs tabs={makeTabs()} />);
    screen.getByText("42");
    cleanup();
  });

  it("switches tabs on click", () => {
    render(<ProfileTabs tabs={makeTabs()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    screen.getByText("Activity content");
    assert.equal(screen.queryByText("Anime content"), null);
    cleanup();
  });

  it("marks the active tab as aria-selected", () => {
    render(<ProfileTabs tabs={makeTabs()} />);
    const anime = screen.getByRole("tab", { name: "Anime 42" });
    const activity = screen.getByRole("tab", { name: "Activity" });
    assert.equal(anime.getAttribute("aria-selected"), "true");
    assert.equal(activity.getAttribute("aria-selected"), "false");
    cleanup();
  });
});
