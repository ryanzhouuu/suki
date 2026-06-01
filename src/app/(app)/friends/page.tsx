import { FriendCard } from "@/components/friends/friend-card";
import { FriendRequestList } from "@/components/friends/friend-request-list";
import { FriendSearch } from "@/components/friends/friend-search";
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

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header>
        <p className="eyebrow">Social</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
          Friends
        </h1>
        <p className="mt-2 text-sm text-muted">
          Find people by username or name, manage requests, and compare taste
          on each friend&apos;s compare page.
        </p>
      </header>

      <FriendSearch />

      <FriendRequestList
        incoming={requests.incoming}
        outgoing={requests.outgoing}
      />

      <section>
        <h2 className="text-lg font-semibold">
          Your friends
          {friends.length > 0 ? (
            <span className="ml-2 font-normal text-muted">({friends.length})</span>
          ) : null}
        </h2>
        {friends.length === 0 ? (
          <div className="mt-4 rounded-card border border-dashed border-line-strong p-10 text-center">
            <p className="font-display text-xl text-ink">No friends yet</p>
            <p className="mt-1 text-sm text-muted">
              Find friends by username and compare rankings once you connect.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {friends.map((friend) => (
              <FriendCard key={friend.friendship.id} friend={friend} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
