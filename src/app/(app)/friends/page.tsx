import { Suspense } from "react";

import { RecommendationInbox } from "@/components/friend-recommendations/recommendation-inbox";
import { FriendActivityFeed } from "@/components/friends/friend-activity-feed";
import { FriendCard } from "@/components/friends/friend-card";
import { FriendRequestList } from "@/components/friends/friend-request-list";
import { FriendSearch } from "@/components/friends/friend-search";
import { ControlRail, WidePageFrame } from "@/components/layout/page-frame";
import { AsyncSectionUnavailable } from "@/components/ui/async-section";
import { requireProfile } from "@/lib/auth/session";
import { getReceivedRecommendations } from "@/lib/friend-recommendations/queries";
import { getFriendActivityFeed } from "@/lib/friends/activity";
import {
  listAcceptedFriends,
  listFriendRequests,
} from "@/lib/friends/queries";
import { runResilientOperation } from "@/lib/resilience";

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-card border border-line bg-surface-2"
        />
      ))}
    </div>
  );
}

function UnavailableSection({
  failure,
  title,
}: {
  failure: {
    correlationId: string;
    retryable: boolean;
    safeMessage: string;
  };
  title: string;
}) {
  return (
    <AsyncSectionUnavailable
      title={`${title} is temporarily unavailable`}
      description={failure.safeMessage}
      referenceId={failure.correlationId.slice(0, 8)}
      retryable={failure.retryable}
    />
  );
}

async function RecommendationsSection({ userId }: { userId: string }) {
  const result = await runResilientOperation(
    {
      route: "/friends",
      operation: "load_received_recommendations",
      dependency: "supabase",
      userId,
    },
    () => getReceivedRecommendations(userId),
  );
  if (result.status === "unavailable") {
    return <UnavailableSection title="Recommendations" failure={result.failure} />;
  }
  return <RecommendationInbox recommendations={result.data} />;
}

async function RequestsSection({ userId }: { userId: string }) {
  const result = await runResilientOperation(
    {
      route: "/friends",
      operation: "load_friend_requests",
      dependency: "supabase",
      userId,
    },
    () => listFriendRequests(userId),
  );
  if (result.status === "unavailable") {
    return <UnavailableSection title="Friend requests" failure={result.failure} />;
  }

  const requests = result.data;
  const pendingCount = requests.incoming.length + requests.outgoing.length;
  return (
    <>
      <FriendRequestList
        incoming={requests.incoming}
        outgoing={requests.outgoing}
      />
      {pendingCount === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface/50 p-4">
          <p className="text-sm font-medium text-ink">No pending requests</p>
          <p className="mt-1 text-xs text-muted">
            Search above to send a request. Once accepted, friends appear on the
            right.
          </p>
        </div>
      ) : null}
    </>
  );
}

async function ActivitySection({ userId }: { userId: string }) {
  const result = await runResilientOperation(
    {
      route: "/friends",
      operation: "load_friend_activity",
      dependency: "supabase",
      userId,
    },
    () => getFriendActivityFeed(userId),
  );
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Activity</h2>
      {result.status === "unavailable" ? (
        <UnavailableSection title="Friend activity" failure={result.failure} />
      ) : (
        <FriendActivityFeed
          initialItems={result.data.items}
          initialCursor={result.data.nextCursor}
        />
      )}
    </section>
  );
}

async function FriendsListSection({ userId }: { userId: string }) {
  const result = await runResilientOperation(
    {
      route: "/friends",
      operation: "load_accepted_friends",
      dependency: "supabase",
      userId,
    },
    () => listAcceptedFriends(userId),
  );

  if (result.status === "unavailable") {
    return (
      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Your friends</h2>
        <UnavailableSection title="Your friends" failure={result.failure} />
      </section>
    );
  }
  const friends = result.data;
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">
          Your friends
          {friends.length > 0 ? (
            <span className="ml-2 font-normal text-muted">({friends.length})</span>
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
  );
}

export default async function FriendsPage() {
  const { user } = await requireProfile();

  return (
    <WidePageFrame className="space-y-8">
      <header>
        <p className="eyebrow">Social</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Friends
        </h1>
      </header>

      <Suspense fallback={<SectionSkeleton />}>
        <RecommendationsSection userId={user.id} />
      </Suspense>

      <ControlRail
        sidebarLabel="Find and manage friends"
        sidebarClassName="space-y-8"
        sidebar={
          <>
            <FriendSearch />
            <Suspense fallback={<SectionSkeleton />}>
              <RequestsSection userId={user.id} />
            </Suspense>
          </>
        }
      >
        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <ActivitySection userId={user.id} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <FriendsListSection userId={user.id} />
        </Suspense>
      </ControlRail>
    </WidePageFrame>
  );
}
