export type HeroHeadline = {
  lead: string;
  emphasis: string;
  trailing?: string;
  description: string;
};

export const HERO_HEADLINES: HeroHeadline[] = [
  {
    lead: "Welcome back to your",
    emphasis: "anime list",
    description:
      "Check your in-progress shows, update your watchlist, and continue refining your rankings.",
  },
  {
    lead: "Back to your",
    emphasis: "watching list",
    description:
      "See what is in progress, update your rankings, or start something new.",
  },
  {
    lead: "Keep your list",
    emphasis: "up to date",
    description:
      "Log progress as you watch and keep your queue organized across every status.",
  },
  {
    lead: "Refine your rankings",
    emphasis: "as you go",
    description:
      "Quick head-to-head picks make it easy to settle close calls between series.",
  },
  {
    lead: "Your favorites,",
    emphasis: "in order",
    description:
      "Build a ranking that reflects what you actually enjoyed watching.",
  },
  {
    lead: "Continue where you",
    emphasis: "paused",
    description:
      "Pick up ongoing shows and keep momentum without losing track of anything.",
  },
  {
    lead: "One place for",
    emphasis: "your anime",
    description:
      "Track progress, manage your watchlist, and update rankings from the same home screen.",
  },
  {
    lead: "Small updates,",
    emphasis: "better rankings",
    description:
      "Every comparison helps your list become more clear and consistent over time.",
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Stable headline for the day per user — no flicker on refresh. */
export function pickHeroHeadline(
  userId: string,
  date: Date = new Date(),
): HeroHeadline {
  const dayKey = date.toISOString().slice(0, 10);
  const index = hashString(`${userId}:${dayKey}`) % HERO_HEADLINES.length;
  return HERO_HEADLINES[index]!;
}
