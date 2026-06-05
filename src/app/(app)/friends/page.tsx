import { FriendCard } from "@/components/friends/friend-card";
import { FriendRequestList } from "@/components/friends/friend-request-list";
import { FriendSearch } from "@/components/friends/friend-search";
import { ControlRail, WidePageFrame } from "@/components/layout/page-frame";
import { requireProfile } from "@/lib/auth/session";
import {
  listAcceptedFriends,
  listFriendRequests,
} from "@/lib/friends/queries";

export default async function FriendsPage() {
  const { user } = await requireProfile();

  const [friends, requests] = await Promise.all([
    listAcceptedFriends(user.id),
    listFriendRequests(user.id),
  ]);

  const pendingCount = requests.incoming.length + requests.outgoing.length;

  return (
    <WidePageFrame className="space-y-8">
      <header>
        <p className="eyebrow">Social</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-ink">
          Friends
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Find people by username or name, manage requests, and compare taste on
          each friend&apos;s compare page.
        </p>
      </header>

      <ControlRail
        sidebarLabel="Find and manage friends"
        sidebarClassName="space-y-8"
        sidebar={
          <>
            <FriendSearch />
            <FriendRequestList
              incoming={requests.incoming}
              outgoing={requests.outgoing}
            />
            {pendingCount === 0 ? (
              <div className="rounded-card border border-dashed border-line-strong bg-surface/50 p-4">
                <p className="text-sm font-medium text-ink">No pending requests</p>
                <p className="mt-1 text-xs text-muted">
                  Search above to send a request. Once accepted, friends appear
                  on the right.
                </p>
              </div>
            ) : null}
          </>
        }
      >
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">
              Your friends
              {friends.length > 0 ? (
                <span className="ml-2 font-normal text-muted">
                  ({friends.length})
                </span>
              ) : null}
            </h2>
          </div>

          {friends.length === 0 ? (
            <div className="mt-4 rounded-card border border-dashed border-line-strong p-10 text-center">
              <p className="font-display text-xl text-ink">No friends yet</p>
              <p className="mt-1 text-sm text-muted">
                Find friends by username and compare rankings once you connect.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {friends.map((friend) => (
                <FriendCard key={friend.friendship.id} friend={friend} />
              ))}
            </ul>
          )}
        </section>
      </ControlRail>
    </WidePageFrame>
  );
}
