"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeAnimeEntry, updateAnimeEntry } from "@/actions/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ANIME_ENTRY_STATUSES,
  STATUS_LABELS,
  WATCHLIST_PRIORITY_LABELS,
  type AnimeEntryStatus,
} from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";

type EntryEditPanelProps = {
  entry: LibraryEntry;
  onClose: () => void;
};

export function EntryEditPanel({ entry, onClose }: EntryEditPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const anime = entry.anime;
  const title =
    anime.english_title || anime.romaji_title || anime.native_title || "Unknown";

  const [status, setStatus] = useState<AnimeEntryStatus>(entry.status);
  const [progressEpisodes, setProgressEpisodes] = useState(
    String(entry.progress_episodes),
  );
  const [personalScore, setPersonalScore] = useState(
    entry.personal_score != null ? String(entry.personal_score) : "",
  );
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [startedAt, setStartedAt] = useState(entry.started_at ?? "");
  const [completedAt, setCompletedAt] = useState(entry.completed_at ?? "");
  const [priority, setPriority] = useState(entry.priority ?? "");
  const [rewatchCount, setRewatchCount] = useState(String(entry.rewatch_count));

  function save() {
    setError(null);
    setMessage(null);

    const progress = progressEpisodes.trim() === "" ? 0 : Number(progressEpisodes);
    if (!Number.isInteger(progress) || progress < 0) {
      setError("Episode progress must be a non-negative integer.");
      return;
    }

    const rewatch = rewatchCount.trim() === "" ? 0 : Number(rewatchCount);
    if (!Number.isInteger(rewatch) || rewatch < 0) {
      setError("Rewatch count must be a non-negative integer.");
      return;
    }

    let score: number | null = null;
    if (personalScore.trim() !== "") {
      score = Number(personalScore);
      if (!Number.isFinite(score) || score < 0 || score > 10) {
        setError("Personal score must be between 0 and 10.");
        return;
      }
    }

    startTransition(async () => {
      const result = await updateAnimeEntry(entry.id, {
        status,
        progressEpisodes: progress,
        personalScore: personalScore.trim() === "" ? null : score,
        notes: notes.trim() === "" ? null : notes,
        startedAt: startedAt.trim() === "" ? null : startedAt,
        completedAt: completedAt.trim() === "" ? null : completedAt,
        priority:
          status === "plan_to_watch" && priority
            ? (priority as "low" | "medium" | "high")
            : null,
        rewatchCount: rewatch,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.message ?? "Saved.");
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Remove from your library?")) return;
    startTransition(async () => {
      const result = await removeAnimeEntry(entry.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Edit entry</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="entry-status">Status</Label>
          <select
            id="entry-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AnimeEntryStatus)}
            className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
          >
            {ANIME_ENTRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entry-progress">
            Episode progress
            {anime.episodes ? ` (of ${anime.episodes})` : ""}
          </Label>
          <Input
            id="entry-progress"
            type="number"
            min={0}
            max={anime.episodes ?? undefined}
            value={progressEpisodes}
            onChange={(e) => setProgressEpisodes(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entry-score">Personal score (0–10)</Label>
          <Input
            id="entry-score"
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={personalScore}
            onChange={(e) => setPersonalScore(e.target.value)}
            placeholder="Optional"
          />
        </div>

        {status === "plan_to_watch" ? (
          <div className="space-y-1.5">
            <Label htmlFor="entry-priority">Watchlist priority</Label>
            <select
              id="entry-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="">None</option>
              {(["high", "medium", "low"] as const).map((value) => (
                <option key={value} value={value}>
                  {WATCHLIST_PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="entry-rewatch">Rewatch count</Label>
          <Input
            id="entry-rewatch"
            type="number"
            min={0}
            value={rewatchCount}
            onChange={(e) => setRewatchCount(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entry-started">Started</Label>
          <Input
            id="entry-started"
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entry-completed">Completed</Label>
          <Input
            id="entry-completed"
            type="date"
            value={completedAt}
            onChange={(e) => setCompletedAt(e.target.value)}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="entry-notes">Notes</Label>
          <textarea
            id="entry-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Why this anime matters to you, where you left off, etc."
            className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={remove}
          className="ml-auto"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
