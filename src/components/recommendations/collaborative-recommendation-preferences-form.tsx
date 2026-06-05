"use client";

import { useActionState, useState } from "react";

import {
  refreshCollaborativeRecommendations,
  type RecommendationsActionState,
} from "@/actions/recommendations";
import {
  COLLABORATIVE_RECOMMENDATION_MODES,
  type CollaborativeRecommendationMode,
} from "@/lib/recommendations/collaborative-types";
import { GenreFilter } from "@/components/filters/genre-filter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ANIME_FORMATS,
  LENGTH_BUCKETS,
  type LengthBucket,
} from "@/lib/recommendations/request-prefs";

const LENGTH_LABELS: Record<LengthBucket, string> = {
  movie: "Movie",
  short: "Short (≤12 episodes)",
  cour: "Standard (13–26 episodes)",
  long: "Long (27+ episodes)",
};

const MODE_LABELS: Record<CollaborativeRecommendationMode, string> = {
  best_shared_match: "Best shared match",
  short_watch: "Short watch",
  new_to_both: "New to both",
  based_on_overlap: "Based on overlap",
  surprise_us: "Surprise us",
};

type CollaborativeRecommendationPreferencesFormProps = {
  friendUserId: string;
  friendUsername: string;
  initialMode: CollaborativeRecommendationMode;
};

export function CollaborativeRecommendationPreferencesForm({
  friendUserId,
  friendUsername,
  initialMode,
}: CollaborativeRecommendationPreferencesFormProps) {
  const [genres, setGenres] = useState<string[]>([]);
  const [lengthBucket, setLengthBucket] = useState<LengthBucket | "">("");
  const [format, setFormat] = useState<string>("");
  const [mode, setMode] = useState<CollaborativeRecommendationMode>(initialMode);

  const [state, formAction, pending] = useActionState(
    refreshCollaborativeRecommendations,
    {} as RecommendationsActionState,
  );

  return (
    <div className="w-full rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">Find a pick for both of you</h2>
        <p className="mt-1 text-xs text-muted">
          Tune the mode and filters, then generate a shared set.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="friendUserId" value={friendUserId} />
        <input type="hidden" name="friendUsername" value={friendUsername} />
        <input type="hidden" name="collaborationMode" value={mode} />

        {genres.map((genre) => (
          <input key={genre} type="hidden" name="genre" value={genre} />
        ))}

        <div className="space-y-1.5">
          <Label htmlFor="collaborationMode">Mode</Label>
          <select
            id="collaborationMode"
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as CollaborativeRecommendationMode)
            }
            className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
          >
            {COLLABORATIVE_RECOMMENDATION_MODES.map((value) => (
              <option key={value} value={value}>
                {MODE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <GenreFilter selected={genres} onChange={setGenres} />

        <div className="grid gap-4 sm:grid-cols-2">
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
            {pending ? "Finding shared picks…" : "Get shared recommendations"}
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
