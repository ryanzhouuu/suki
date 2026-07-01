import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { FriendActivityTeaser as FriendActivityTeaserType } from "@/components/home/friend-activity-teaser";
import type { FeedItem } from "@/lib/friends/activity-feed";

let feedItems: FeedItem[] = [];

mock.module("@/lib/friends/activity", {
  namedExports: {
    getFriendActivityFeed: async () => ({ items: feedItems, nextCursor: null }),
  },
});

let FriendActivityTeaser: typeof FriendActivityTeaserType;

before(async () => {
  ({ FriendActivityTeaser } = await import(
    "@/components/home/friend-activity-teaser"
  ));
});

function makeItem(id: string): FeedItem {
  return {
    id,
    actor: { userId: "u1", username: "alexj", displayName: "Alex", avatarUrl: null },
    kind: "completed",
    createdAt: new Date().toISOString(),
    count: 1,
    refs: [],
  };
}

describe("FriendActivityTeaser", () => {
  afterEach(() => {
    cleanup();
    feedItems = [];
  });

  it("renders nothing when there's no friend activity", async () => {
    feedItems = [];
    const element = await FriendActivityTeaser({ userId: "u1" });
    const { container } = render(element);
    assert.equal(container.firstChild, null);
  });

  it("shows up to 3 items with a 'See all' link", async () => {
    feedItems = ["1", "2", "3", "4"].map(makeItem);
    const element = await FriendActivityTeaser({ userId: "u1" });
    render(element);
    screen.getByText("Friend activity");
    assert.equal(screen.getAllByText("Alex").length, 3);
    const link = screen.getByRole("link", { name: /See all/ });
    assert.equal(link.getAttribute("href"), "/friends");
  });
});
