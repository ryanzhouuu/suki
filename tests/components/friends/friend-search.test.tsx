import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FriendSearch as FriendSearchType } from "@/components/friends/friend-search";
import type { FriendSearchResult } from "@/lib/friends/queries";

import { installRouterMock } from "../../helpers/mock-router";

installRouterMock();

let searchResult: { users: FriendSearchResult[]; error?: string } = {
  users: [],
};

mock.module("@/actions/friends", {
  namedExports: {
    searchUsers: async () => searchResult,
    sendFriendRequest: async () => ({}),
    removeFriend: async () => ({}),
    cancelFriendRequest: async () => ({}),
    respondToFriendRequest: async () => ({}),
  },
});

let FriendSearch: typeof FriendSearchType;

before(async () => {
  ({ FriendSearch } = await import("@/components/friends/friend-search"));
});

describe("FriendSearch", () => {
  afterEach(() => {
    cleanup();
    searchResult = { users: [] };
  });

  it("does not search until the query is at least 2 characters", async () => {
    render(<FriendSearch />);
    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "a" },
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.equal(screen.queryByText("Searching…"), null);
    assert.equal(screen.queryByText("No users found."), null);
  });

  it("shows matching results after the debounce delay", async () => {
    searchResult = {
      users: [
        {
          user_id: "u2",
          username: "bob",
          display_name: "Bob Smith",
          avatar_url: null,
          bio: null,
          status: "none",
          friendshipId: null,
        },
      ],
    };
    render(<FriendSearch />);
    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "bo" },
    });
    await screen.findByText("Bob Smith", {}, { timeout: 2000 });
    screen.getByRole("button", { name: "Add friend" });
  });

  it("shows 'No users found.' when the search returns nothing", async () => {
    searchResult = { users: [] };
    render(<FriendSearch />);
    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "zz" },
    });
    await screen.findByText("No users found.", {}, { timeout: 2000 });
  });

  it("shows the search error when the action returns one", async () => {
    searchResult = { users: [], error: "Search failed" };
    render(<FriendSearch />);
    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "zz" },
    });
    await screen.findByRole("alert", {}, { timeout: 2000 });
    screen.getByText("Search failed");
  });

  it("clears results when the query drops below 2 characters", async () => {
    searchResult = {
      users: [
        {
          user_id: "u2",
          username: "bob",
          display_name: null,
          avatar_url: null,
          bio: null,
          status: "none",
          friendshipId: null,
        },
      ],
    };
    render(<FriendSearch />);
    const input = screen.getByLabelText("Search users");
    fireEvent.change(input, { target: { value: "bo" } });
    await screen.findByText("bob", {}, { timeout: 2000 });
    fireEvent.change(input, { target: { value: "b" } });
    await waitFor(() => assert.equal(screen.queryByText("bob"), null));
  });
});
