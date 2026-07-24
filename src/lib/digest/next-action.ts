export type DigestActionKind =
  | "catch_up"
  | "continue"
  | "friend_recommendation"
  | "personal_recommendation"
  | "seasonal_browse";

export type DigestAction = {
  kind: DigestActionKind;
  href: string;
  title: string;
  description: string;
};

const PRIORITY: DigestActionKind[] = [
  "catch_up",
  "continue",
  "friend_recommendation",
  "personal_recommendation",
  "seasonal_browse",
];

export function selectNextAction(
  candidates: Partial<Record<DigestActionKind, DigestAction>>,
): DigestAction {
  for (const kind of PRIORITY) {
    const candidate = candidates[kind];
    if (candidate) return candidate;
  }
  return {
    kind: "seasonal_browse",
    href: "/search",
    title: "Find your next anime",
    description: "Browse the season and add something that looks good.",
  };
}

