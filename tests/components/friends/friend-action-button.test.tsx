import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FriendActionButton as FriendActionButtonType } from "@/components/friends/friend-action-button";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const calls: string[] = [];
let actionResult: { error?: string } = {};

mock.module("@/actions/friends", {
  namedExports: {
    sendFriendRequest: async (userId: string) => {
      calls.push(`send:${userId}`);
      return actionResult;
    },
    removeFriend: async (friendshipId: string) => {
      calls.push(`remove:${friendshipId}`);
      return actionResult;
    },
    cancelFriendRequest: async (friendshipId: string) => {
      calls.push(`cancel:${friendshipId}`);
      return actionResult;
    },
    respondToFriendRequest: async (friendshipId: string, action: string) => {
      calls.push(`respond:${friendshipId}:${action}`);
      return actionResult;
    },
  },
});

let FriendActionButton: typeof FriendActionButtonType;

before(async () => {
  ({ FriendActionButton } = await import(
    "@/components/friends/friend-action-button"
  ));
});

describe("FriendActionButton", () => {
  afterEach(() => {
    cleanup();
    calls.length = 0;
    actionResult = {};
    router.refresh = () => {};
  });

  it("renders nothing on your own profile", () => {
    const { container } = render(
      <FriendActionButton
        targetUserId="u2"
        targetUsername="bob"
        friendshipId={null}
        status="none"
        isOwnProfile
      />,
    );
    assert.equal(container.textContent, "");
  });

  it("sends a friend request and refreshes on success", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(
      <FriendActionButton
        targetUserId="u2"
        targetUsername="bob"
        friendshipId={null}
        status="none"
        isOwnProfile={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add friend" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(calls, ["send:u2"]);
  });

  it("shows the action error instead of refreshing when the action fails", async () => {
    actionResult = { error: "Already friends" };
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(
      <FriendActionButton
        targetUserId="u2"
        targetUsername="bob"
        friendshipId={null}
        status="none"
        isOwnProfile={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add friend" }));
    await screen.findByRole("alert");
    screen.getByText("Already friends");
    assert.equal(refreshed, false);
  });

  it("shows accept/decline for incoming requests and calls respondToFriendRequest", async () => {
    render(
      <FriendActionButton
        targetUserId="u2"
        targetUsername="bob"
        friendshipId="f1"
        status="pending_incoming"
        isOwnProfile={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => assert.deepEqual(calls, ["respond:f1:accept"]));
  });

  it("shows cancel for outgoing requests", async () => {
    render(
      <FriendActionButton
        targetUserId="u2"
        targetUsername="bob"
        friendshipId="f1"
        status="pending_outgoing"
        isOwnProfile={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));
    await waitFor(() => assert.deepEqual(calls, ["cancel:f1"]));
  });

  it("shows remove and a compare-taste link for existing friends", () => {
    render(
      <FriendActionButton
        targetUserId="u2"
        targetUsername="bob"
        friendshipId="f1"
        status="friends"
        isOwnProfile={false}
      />,
    );
    screen.getByRole("button", { name: "Remove friend" });
    screen.getByRole("link", { name: "Compare taste" });
  });

  it("shows a blocked message with no actionable button", () => {
    render(
      <FriendActionButton
        targetUserId="u2"
        targetUsername="bob"
        friendshipId={null}
        status="blocked"
        isOwnProfile={false}
      />,
    );
    screen.getByText("Cannot send request.");
    assert.equal(screen.queryByRole("button"), null);
  });
});
