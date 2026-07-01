import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FriendActivityFeed as FriendActivityFeedType } from "@/components/friends/friend-activity-feed";
import type { FeedItem } from "@/lib/friends/activity-feed";

let loadFriendActivityResult: { items: FeedItem[]; nextCursor: string | null } | Error = {
  items: [],
  nextCursor: null,
};

mock.module("@/actions/friends", {
  namedExports: {
    loadFriendActivity: async () => {
      if (loadFriendActivityResult instanceof Error) throw loadFriendActivityResult;
      return loadFriendActivityResult;
    },
  },
});

let FriendActivityFeed: typeof FriendActivityFeedType;

before(async () => {
  ({ FriendActivityFeed } = await import(
    "@/components/friends/friend-activity-feed"
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

describe("FriendActivityFeed", () => {
  afterEach(() => {
    cleanup();
    loadFriendActivityResult = { items: [], nextCursor: null };
  });

  it("shows an empty state when there are no items", () => {
    render(<FriendActivityFeed initialItems={[]} initialCursor={null} />);
    screen.getByText("No recent activity");
  });

  it("renders the initial items and hides 'Load more' without a cursor", () => {
    render(
      <FriendActivityFeed
        initialItems={[makeItem("1"), makeItem("2")]}
        initialCursor={null}
      />,
    );
    assert.equal(screen.queryAllByRole("link", { name: "Alex" }).length, 2);
    assert.equal(screen.queryByRole("button", { name: "Load more" }), null);
  });

  it("loads more items and appends them on click", async () => {
    loadFriendActivityResult = { items: [makeItem("2")], nextCursor: null };
    render(
      <FriendActivityFeed initialItems={[makeItem("1")]} initialCursor="cursor-1" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => {
      assert.equal(screen.queryAllByRole("link", { name: "Alex" }).length, 2);
    });
    assert.equal(screen.queryByRole("button", { name: "Load more" }), null);
  });

  it("shows an error message when loading more fails", async () => {
    loadFriendActivityResult = new Error("network down");
    render(
      <FriendActivityFeed initialItems={[makeItem("1")]} initialCursor="cursor-1" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByRole("alert");
    screen.getByText("Couldn't load more activity. Try again.");
  });
});
