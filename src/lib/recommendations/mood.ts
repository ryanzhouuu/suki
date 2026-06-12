import type { AdventurousnessLevel } from "./request-prefs";

/**
 * Curated mood presets. The `seedText` is what gets embedded and blended into the
 * user's taste vector; `label` is shown in the UI and recommendation explanations.
 */
export const MOOD_PRESETS = {
  cozy: {
    label: "cozy",
    seedText:
      "warm, comforting, low-stakes, relaxing slice-of-life with a gentle, healing atmosphere",
  },
  emotional: {
    label: "emotional",
    seedText:
      "deeply moving, tear-jerking, poignant drama that explores loss, love, and bittersweet feelings",
  },
  hype: {
    label: "hype",
    seedText:
      "high-energy, adrenaline-fueled action with intense battles, tournaments, and triumphant moments",
  },
  dark: {
    label: "dark",
    seedText:
      "grim, psychological, morally complex stories with tension, violence, and a bleak tone",
  },
  funny: {
    label: "funny",
    seedText:
      "lighthearted, comedic, gag-filled fun with witty humor and absurd, feel-good antics",
  },
  background: {
    label: "easy background watch",
    seedText:
      "easy, low-effort, episodic background watching that is fun without demanding full attention",
  },
} as const satisfies Record<string, { label: string; seedText: string }>;

export type MoodPresetKey = keyof typeof MOOD_PRESETS;

export const MOOD_PRESET_KEYS = new Set<string>(Object.keys(MOOD_PRESETS));

function isPresetKey(mood: string): mood is MoodPresetKey {
  return MOOD_PRESET_KEYS.has(mood);
}

/** Preset key → its descriptive seed text; free text is used as-is. */
export function resolveMoodSeedText(mood: string): string {
  return isPresetKey(mood) ? MOOD_PRESETS[mood].seedText : mood;
}

/** Human-friendly label for a mood (preset label, or the raw free text). */
export function moodLabel(mood: string): string {
  return isPresetKey(mood) ? MOOD_PRESETS[mood].label : mood;
}

/** How heavily the mood steers results, scaling with adventurousness. */
export function moodBlendWeight(level: AdventurousnessLevel): number {
  switch (level) {
    case "safe":
      return 0.2;
    case "adventurous":
      return 0.5;
    case "balanced":
    default:
      return 0.35;
  }
}

/**
 * Weighted average of the taste and mood vectors, L2-normalized so the result is a
 * unit vector suitable for cosine similarity search. `weight` is the mood share.
 */
export function blendEmbeddings(
  taste: number[],
  mood: number[],
  weight: number,
): number[] {
  if (taste.length !== mood.length) {
    throw new Error("Cannot blend embeddings of different dimensions.");
  }
  const tasteWeight = 1 - weight;
  const blended = taste.map((t, i) => t * tasteWeight + mood[i] * weight);

  let norm = 0;
  for (const v of blended) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return blended;

  return blended.map((v) => v / norm);
}
