import { FocusedRecommendations } from "@/components/recommendations/focused-recommendations";
import type { RecommendationRow } from "@/lib/recommendations/types";

type CollaborativeFocusedRecommendationsProps = {
  items: RecommendationRow[];
};

export function CollaborativeFocusedRecommendations({
  items,
}: CollaborativeFocusedRecommendationsProps) {
  return (
    <FocusedRecommendations
      items={items}
      contextLabel="Shared recommendation"
      whyLabel="Why this works for both of you"
    />
  );
}
