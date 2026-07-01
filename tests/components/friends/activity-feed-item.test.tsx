import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { ActivityFeedItem } from "@/components/friends/activity-feed-item";
import type { FeedItem } from "@/lib/friends/activity-feed";

function makeItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: "item-1",
    actor: {
      userId: "u1",
      username: "alexj",
      displayName: "Alex Johnson",
      avatarUrl: null,
    },
    kind: "completed",
    createdAt: new Date(Date.now() - 60_000).toISOString(),
    count: 1,
    refs: [],
    ...overrides,
  };
}

describe("ActivityFeedItem", () => {
  it("links the actor name to their profile", () => {
    render(<ActivityFeedItem item={makeItem()} />);
    const link = screen.getByRole("link", { name: "Alex Johnson" });
    assert.equal(link.getAttribute("href"), "/u/alexj");
    cleanup();
  });

  it("falls back to username when displayName is null", () => {
    render(
      <ActivityFeedItem
        item={makeItem({
          actor: {
            userId: "u1",
            username: "alexj",
            displayName: null,
            avatarUrl: null,
          },
        })}
      />,
    );
    screen.getByRole("link", { name: "alexj" });
    cleanup();
  });

  it("renders a poster link for each ref", () => {
    render(
      <ActivityFeedItem
        item={makeItem({
          refs: [
            {
              kind: "anime",
              title: "Naruto",
              coverImageUrl: null,
              href: "/anime/1",
            },
          ],
        })}
      />,
    );
    const posterLink = screen.getByRole("link", { name: "Naruto" });
    assert.equal(posterLink.getAttribute("href"), "/anime/1");
    cleanup();
  });

  it("renders no cover row when there are no refs", () => {
    // Two links point at the actor's profile: the avatar and the name.
    render(<ActivityFeedItem item={makeItem({ refs: [] })} />);
    assert.equal(screen.queryAllByRole("link").length, 2);
    cleanup();
  });
});
