"use client";

import { useActionState, useState } from "react";

import {
  refreshRecommendations,
  type RecommendationsActionState,
} from "@/actions/recommendations";
import { GenreFilter } from "@/components/filters/genre-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOOD_PRESETS, type MoodPresetKey } from "@/lib/recommendations/mood";
import {
  ADVENTUROUSNESS_LEVELS,
  ANIME_FORMATS,
  LENGTH_BUCKETS,
  type AdventurousnessLevel,
  type LengthBucket,
} from "@/lib/recommendations/request-prefs";

const LENGTH_LABELS: Record<LengthBucket, string> = {
  movie: "Movie",
  short: "Short (≤12 episodes)",
  cour: "Standard (13–26 episodes)",
  long: "Long (27+ episodes)",
};

const MOOD_PRESET_KEYS = Object.keys(MOOD_PRESETS) as MoodPresetKey[];

const ADVENTUROUSNESS_LABELS: Record<AdventurousnessLevel, string> = {
  safe: "Safe",
  balanced: "Balanced",
  adventurous: "Adventurous",
};

const chipClass = (active: boolean) =>
  `rounded-full px-3 py-2 text-xs font-medium transition-colors ${
    active
      ? "bg-accent text-on-accent shadow-sm"
      : "border border-line-strong bg-paper text-muted hover:border-accent hover:text-accent"
  }`;

export function RecommendationPreferencesForm() {
  const [genres, setGenres] = useState<string[]>([]);
  const [lengthBucket, setLengthBucket] = useState<LengthBucket | "">("");
  const [format, setFormat] = useState<string>("");
  const [moodPreset, setMoodPreset] = useState<MoodPresetKey | "">("");
  const [moodText, setMoodText] = useState<string>("");
  const [adventurousness, setAdventurousness] =
    useState<AdventurousnessLevel>("balanced");

  const moodTextActive = moodText.trim().length > 0;

  const [state, formAction, pending] = useActionState(
    refreshRecommendations,
    {} as RecommendationsActionState,
  );

  return (
    <div className="w-full rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">What do you want next?</h2>
        <p className="mt-1 text-xs text-muted">
          Set preferences for this request only. Each visit starts fresh; refresh
          to get a new mix including adventurous picks.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {genres.map((genre) => (
          <input key={genre} type="hidden" name="genre" value={genre} />
        ))}

        <GenreFilter selected={genres} onChange={setGenres} layout="wrap" />

        <input type="hidden" name="moodPreset" value={moodPreset} />
        <input type="hidden" name="adventurousness" value={adventurousness} />

        <div className="space-y-1.5">
          <Label htmlFor="moodText">Mood</Label>
          <div className="flex flex-wrap gap-2">
            {MOOD_PRESET_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={!moodTextActive && moodPreset === key}
                disabled={moodTextActive}
                onClick={() =>
                  setMoodPreset((prev) => (prev === key ? "" : key))
                }
                className={`${chipClass(!moodTextActive && moodPreset === key)} disabled:opacity-40`}
              >
                {MOOD_PRESETS[key].label}
              </button>
            ))}
          </div>
          <Input
            id="moodText"
            name="moodText"
            value={moodText}
            onChange={(e) => setMoodText(e.target.value)}
            maxLength={200}
            placeholder="…or describe the vibe you want"
          />
          {moodTextActive ? (
            <p className="text-xs text-muted">
              Using your description — it overrides the chips above.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label>Adventurousness</Label>
          <div className="flex flex-wrap gap-2">
            {ADVENTUROUSNESS_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={adventurousness === level}
                onClick={() => setAdventurousness(level)}
                className={chipClass(adventurousness === level)}
              >
                {ADVENTUROUSNESS_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-1.5">
            <Label htmlFor="lengthBucket">Length</Label>
            <select
              id="lengthBucket"
              name="lengthBucket"
              value={lengthBucket}
              onChange={(e) =>
                setLengthBucket(e.target.value as LengthBucket | "")
              }
              className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="">Any length</option>
              {LENGTH_BUCKETS.map((bucket) => (
                <option key={bucket} value={bucket}>
                  {LENGTH_LABELS[bucket]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="">Any format</option>
              {ANIME_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Finding picks…" : "Get recommendations"}
          </Button>
          {state.error ? (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p className="text-sm text-muted">{state.message}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
