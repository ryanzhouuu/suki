import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FriendRequestList as FriendRequestListType } from "@/components/friends/friend-request-list";
import type { FriendWithProfile } from "@/lib/friends/queries";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const calls: string[] = [];
let actionResult: { error?: string } = {};

mock.module("@/actions/friends", {
  namedExports: {
    respondToFriendRequest: async (friendshipId: string, action: string) => {
      calls.push(`respond:${friendshipId}:${action}`);
      return actionResult;
    },
    cancelFriendRequest: async (friendshipId: string) => {
      calls.push(`cancel:${friendshipId}`);
      return actionResult;
    },
  },
});

let FriendRequestList: typeof FriendRequestListType;

before(async () => {
  ({ FriendRequestList } = await import(
    "@/components/friends/friend-request-list"
  ));
});

function makeRequest(id: string, username: string): FriendWithProfile {
  return {
    friendship: { id } as FriendWithProfile["friendship"],
    profile: {
      user_id: `u-${id}`,
      username,
      display_name: null,
      avatar_url: null,
      bio: null,
    },
  };
}

describe("FriendRequestList", () => {
  afterEach(() => {
    cleanup();
    calls.length = 0;
    actionResult = {};
    router.refresh = () => {};
  });

  it("renders nothing when there are no requests", () => {
    const { container } = render(
      <FriendRequestList incoming={[]} outgoing={[]} />,
    );
    assert.equal(container.firstChild, null);
  });

  it("shows incoming requests with accept/decline actions", async () => {
    render(
      <FriendRequestList
        incoming={[makeRequest("f1", "alice")]}
        outgoing={[]}
      />,
    );
    screen.getByText("Incoming requests");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => assert.deepEqual(calls, ["respond:f1:accept"]));
  });

  it("shows outgoing requests with a cancel action", async () => {
    render(
      <FriendRequestList incoming={[]} outgoing={[makeRequest("f2", "bob")]} />,
    );
    screen.getByText("Sent requests");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => assert.deepEqual(calls, ["cancel:f2"]));
  });

  it("shows the error message when an action fails", async () => {
    actionResult = { error: "Could not respond" };
    render(
      <FriendRequestList incoming={[makeRequest("f1", "alice")]} outgoing={[]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    await screen.findByRole("alert");
    screen.getByText("Could not respond");
  });
});
