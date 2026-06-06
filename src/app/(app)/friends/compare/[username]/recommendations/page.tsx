import Link from "next/link";
import { notFound } from "next/navigation";

import { loadCollaborativeRecommendationsForUsers } from "@/actions/recommendations";
import { CollaborativeRecommendationPreferencesForm } from "@/components/recommendations/collaborative-recommendation-preferences-form";
import { CollaborativeFocusedRecommendations } from "@/components/recommendations/collaborative-focused-recommendations";
import { WidePageFrame } from "@/components/layout/page-frame";
import { RecommendationsStage } from "@/components/recommendations/recommendations-stage";
import { requireProfile } from "@/lib/auth/session";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { friendshipStatusForViewer } from "@/lib/friends/relationship";
import {
  DEFAULT_COLLABORATIVE_RECOMMENDATION_PREFS,
  type CollaborativeRecommendationMode,
  isCollaborativeRecommendationMode,
} from "@/lib/recommendations/collaborative-types";
import { FOCUSED_RECOMMENDATION_LIMIT } from "@/lib/recommendations/constants";
import { getProfileByUsername } from "@/lib/profiles/queries";

type CollaborativeRecommendationsPageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function CollaborativeRecommendationsPage({
  params,
  searchParams,
}: CollaborativeRecommendationsPageProps) {
  const { username } = await params;
  const { mode: requestedMode } = await searchParams;
  const requestedModeValue = requestedMode ?? "";
  let mode: CollaborativeRecommendationMode =
    DEFAULT_COLLABORATIVE_RECOMMENDATION_PREFS.mode;
  if (isCollaborativeRecommendationMode(requestedModeValue)) {
    mode = requestedModeValue;
  }

  const { user, profile: viewerProfile } = await requireProfile();
  const friendProfile = await getProfileByUsername(username);
  if (!friendProfile) notFound();

  const friendship = await getFriendshipBetween(user.id, friendProfile.user_id);
  const status = friendshipStatusForViewer(friendship, user.id);
  if (status !== "friends") notFound();

  const { configured, items } = await loadCollaborativeRecommendationsForUsers(
    user.id,
    friendProfile.user_id,
    mode,
  );
  const friendDisplayName = friendProfile.display_name || friendProfile.username;
  const viewerDisplayName = viewerProfile.display_name || viewerProfile.username;

  return (
    <WidePageFrame className="space-y-8">
      <header className="space-y-3">
        <Link
          href={`/friends/compare/${friendProfile.username}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Back to taste match
        </Link>
        <p className="eyebrow">For both of you</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Collaborative recommendations
        </h1>
        <p className="max-w-2xl text-muted">
          Built from {viewerDisplayName} and {friendDisplayName}&apos;s shared and
          complementary taste signals.
        </p>
      </header>

      {!configured ? (
        <RecommendationsStage>
          <div className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">
            Collaborative recommendations need <code className="text-ink">OPENAI_API_KEY</code>{" "}
            configured on the server.
          </div>
        </RecommendationsStage>
      ) : null}

      <RecommendationsStage>
        <CollaborativeRecommendationPreferencesForm
          friendUserId={friendProfile.user_id}
          friendUsername={friendProfile.username}
          initialMode={mode}
        />
      </RecommendationsStage>

      {items.length === 0 ? (
        <RecommendationsStage>
          <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
            <p className="font-display text-xl text-ink">No shared picks yet</p>
            <p className="mt-2 text-sm text-muted">
              Generate recommendations above to create collaborative picks for this
              mode.
            </p>
          </div>
        </RecommendationsStage>
      ) : (
        <CollaborativeFocusedRecommendations
          items={items.slice(0, FOCUSED_RECOMMENDATION_LIMIT)}
        />
      )}
    </WidePageFrame>
  );
}
