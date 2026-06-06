import Link from "next/link";
import { notFound } from "next/navigation";

import { CompareHighlights } from "@/components/friends/compare-highlights";
import { TasteSimilarityMeter } from "@/components/friends/taste-similarity-meter";
import { WidePageFrame } from "@/components/layout/page-frame";
import { requireProfile } from "@/lib/auth/session";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { friendshipStatusForViewer } from "@/lib/friends/relationship";
import {
  getTasteMatchProfile,
} from "@/lib/friends/taste-similarity";
import { getProfileByUsername } from "@/lib/profiles/queries";

type ComparePageProps = {
  params: Promise<{ username: string }>;
};

export default async function FriendsComparePage({ params }: ComparePageProps) {
  const { username } = await params;
  const { user, profile: viewerProfile } = await requireProfile();

  const friendProfile = await getProfileByUsername(username);
  if (!friendProfile) {
    notFound();
  }

  const friendship = await getFriendshipBetween(
    user.id,
    friendProfile.user_id,
  );
  const status = friendshipStatusForViewer(friendship, user.id);

  if (status !== "friends") {
    notFound();
  }

  const friendDisplayName =
    friendProfile.display_name || friendProfile.username;
  const viewerDisplayName =
    viewerProfile.display_name || viewerProfile.username;

  const match = await getTasteMatchProfile(user.id, friendProfile.user_id);

  return (
    <WidePageFrame className="space-y-8">
      <header>
        <Link
          href="/friends"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Friends
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Taste match
        </h1>
        <p className="mt-2 text-muted">
          You and{" "}
          <Link
            href={`/u/${friendProfile.username}`}
            className="font-medium text-ink hover:text-accent"
          >
            {friendDisplayName}
          </Link>
        </p>
      </header>

      <TasteSimilarityMeter
        similarity={match.similarity}
        friendDisplayName={friendDisplayName}
      />

      <CompareHighlights
        match={match}
        viewerLabel={viewerDisplayName}
        friendLabel={friendDisplayName}
        friendUsername={friendProfile.username}
      />
    </WidePageFrame>
  );
}
