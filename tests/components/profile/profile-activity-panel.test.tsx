import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { ProfileActivityPanel } from "@/components/profile/profile-activity-panel";
import type { ProfileActivity } from "@/lib/profiles/stats";
import type { LibraryEntry } from "@/lib/library/queries";

function makeEntry(id: string, title: string): LibraryEntry {
  return {
    id,
    anime: {
      anilist_id: 20,
      english_title: title,
      romaji_title: title,
      cover_image_url: null,
    },
  } as unknown as LibraryEntry;
}

function makeActivity(overrides: Partial<ProfileActivity> = {}): ProfileActivity {
  return {
    recentlyCompleted: [],
    recentlyAdded: [],
    recentComparisonCount: null,
    ...overrides,
  };
}

describe("ProfileActivityPanel", () => {
  it("renders nothing when there's no activity to show", () => {
    const { container } = render(
      <ProfileActivityPanel activity={makeActivity()} isOwnProfile={false} />,
    );
    assert.equal(container.firstChild, null);
    cleanup();
  });

  it("shows recently completed and recently added lists", () => {
    render(
      <ProfileActivityPanel
        activity={makeActivity({
          recentlyCompleted: [makeEntry("1", "Naruto")],
          recentlyAdded: [makeEntry("2", "One Piece")],
        })}
        isOwnProfile={false}
      />,
    );
    screen.getByText("Recently completed");
    screen.getByText("Naruto");
    screen.getByText("Recently added");
    screen.getByText("One Piece");
    cleanup();
  });

  it("shows the comparison count and pluralizes it for your own profile", () => {
    render(
      <ProfileActivityPanel
        activity={makeActivity({ recentComparisonCount: 5 })}
        isOwnProfile
      />,
    );
    screen.getByText("series comparisons recorded.", { exact: false });
    screen.getByRole("link", { name: /Keep ranking/ });
    cleanup();
  });

  it("keeps the comparison count singular when it's 1", () => {
    render(
      <ProfileActivityPanel
        activity={makeActivity({ recentComparisonCount: 1 })}
        isOwnProfile
      />,
    );
    screen.getByText("series comparison recorded.", { exact: false });
    cleanup();
  });

  it("hides the comparison count on someone else's profile", () => {
    render(
      <ProfileActivityPanel
        activity={makeActivity({ recentComparisonCount: 5 })}
        isOwnProfile={false}
      />,
    );
    assert.equal(screen.queryByText(/series comparison/), null);
    cleanup();
  });
});
