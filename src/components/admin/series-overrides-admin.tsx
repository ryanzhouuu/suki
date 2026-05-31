"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState, useTransition } from "react";

import {
  removeSeriesOverride,
  saveSeriesOverride,
  searchAnimeForSeriesAdmin,
  searchSeriesForSeriesAdmin,
  type AdminAnimeSearchHit,
  type AdminSeriesSearchHit,
  type OverrideListItem,
  type SeriesAdminActionState,
} from "@/actions/series-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SeriesOverridesAdminProps = {
  initialOverrides: OverrideListItem[];
};

const ACTION_LABELS: Record<string, string> = {
  force_series: "Force into series",
  force_singleton: "Force own series",
  exclude_from_auto_group: "Exclude from auto-group",
};

export function SeriesOverridesAdmin({
  initialOverrides,
}: SeriesOverridesAdminProps) {
  const router = useRouter();
  const [saveState, saveAction, savePending] = useActionState<
    SeriesAdminActionState,
    FormData
  >(saveSeriesOverride, {});

  const [removedAnilistIds, setRemovedAnilistIds] = useState<Set<number>>(
    () => new Set(),
  );
  const overrides = initialOverrides.filter(
    (item) => !removedAnilistIds.has(item.override.anilist_id),
  );
  const [anilistId, setAnilistId] = useState("");
  const [action, setAction] = useState<
    "force_series" | "force_singleton" | "exclude_from_auto_group"
  >("force_series");
  const [targetSeriesId, setTargetSeriesId] = useState("");
  const [targetAnilistPrimaryId, setTargetAnilistPrimaryId] = useState("");
  const [notes, setNotes] = useState("");

  const [animeQuery, setAnimeQuery] = useState("");
  const [animeHits, setAnimeHits] = useState<AdminAnimeSearchHit[]>([]);
  const [seriesQuery, setSeriesQuery] = useState("");
  const [seriesHits, setSeriesHits] = useState<AdminSeriesSearchHit[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AdminAnimeSearchHit | null>(
    null,
  );
  const [selectedSeries, setSelectedSeries] = useState<AdminSeriesSearchHit | null>(
    null,
  );

  const [removeMessage, setRemoveMessage] = useState<SeriesAdminActionState | null>(
    null,
  );
  const [isRemoving, startRemove] = useTransition();
  const [isSearchingAnime, startAnimeSearch] = useTransition();
  const [isSearchingSeries, startSeriesSearch] = useTransition();

  useEffect(() => {
    if (saveState.success) {
      router.refresh();
    }
  }, [saveState.success, router]);

  const runAnimeSearch = useCallback((q: string) => {
    startAnimeSearch(async () => {
      const hits = await searchAnimeForSeriesAdmin(q);
      setAnimeHits(hits);
    });
  }, []);

  const runSeriesSearch = useCallback((q: string) => {
    startSeriesSearch(async () => {
      const hits = await searchSeriesForSeriesAdmin(q);
      setSeriesHits(hits);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (animeQuery.trim().length >= 2) runAnimeSearch(animeQuery);
      else setAnimeHits([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [animeQuery, runAnimeSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (seriesQuery.trim().length >= 2) runSeriesSearch(seriesQuery);
      else setSeriesHits([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [seriesQuery, runSeriesSearch]);

  function selectAnime(hit: AdminAnimeSearchHit) {
    setSelectedAnime(hit);
    setAnilistId(String(hit.anilistId));
    setAnimeQuery(hit.title);
    setAnimeHits([]);
  }

  function selectSeries(hit: AdminSeriesSearchHit) {
    setSelectedSeries(hit);
    setTargetSeriesId(hit.id);
    setTargetAnilistPrimaryId(String(hit.anilistPrimaryId));
    setSeriesQuery(hit.canonicalTitle);
    setSeriesHits([]);
  }

  function handleRemove(anilistIdToRemove: number) {
    setRemoveMessage(null);
    startRemove(async () => {
      const result = await removeSeriesOverride(anilistIdToRemove);
      setRemoveMessage(result);
      if (!result.error) {
        setRemovedAnilistIds((prev) => new Set(prev).add(anilistIdToRemove));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-10">
      <section className="card space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold">New override</h2>
          <p className="mt-1 text-sm text-muted">
            Saves the override, remaps the anime, merges comparisons off the old
            series row, deletes orphan series, and recomputes affected rankings.
          </p>
        </div>

        <form action={saveAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="anime_search">Anime (search or AniList ID)</Label>
            <Input
              id="anime_search"
              value={animeQuery}
              onChange={(e) => setAnimeQuery(e.target.value)}
              placeholder="Title or AniList ID…"
              autoComplete="off"
            />
            {isSearchingAnime ? (
              <p className="text-xs text-faint">Searching…</p>
            ) : null}
            {animeHits.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface">
                {animeHits.map((hit) => (
                  <li key={hit.anilistId}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-surface-2"
                      onClick={() => selectAnime(hit)}
                    >
                      <span className="font-medium text-ink">{hit.title}</span>
                      <span className="text-xs text-muted">
                        AniList {hit.anilistId}
                        {hit.format ? ` · ${hit.format}` : ""}
                        {hit.source === "anilist" ? " · not cached yet" : ""}
                        {hit.currentSeriesTitle
                          ? ` · currently “${hit.currentSeriesTitle}”`
                          : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <Label htmlFor="anilist_id">AniList ID</Label>
            <Input
              id="anilist_id"
              name="anilist_id"
              required
              value={anilistId}
              onChange={(e) => setAnilistId(e.target.value)}
              inputMode="numeric"
            />
            {selectedAnime ? (
              <p className="mt-1 text-xs text-muted">
                Selected: {selectedAnime.title}
                {selectedAnime.currentSeriesTitle
                  ? ` (series: ${selectedAnime.currentSeriesTitle})`
                  : ""}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="action">Action</Label>
            <select
              id="action"
              name="action"
              className="mt-1 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
              value={action}
              onChange={(e) =>
                setAction(
                  e.target.value as
                    | "force_series"
                    | "force_singleton"
                    | "exclude_from_auto_group",
                )
              }
            >
              <option value="force_series">Force into series</option>
              <option value="force_singleton">Force own series</option>
              <option value="exclude_from_auto_group">
                Exclude from auto-group
              </option>
            </select>
          </div>

          {action === "force_series" ? (
            <div className="space-y-4 rounded-xl border border-line bg-surface-2/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="series_search">Target series</Label>
                <Input
                  id="series_search"
                  value={seriesQuery}
                  onChange={(e) => setSeriesQuery(e.target.value)}
                  placeholder="Series title or primary AniList ID…"
                  autoComplete="off"
                />
                {isSearchingSeries ? (
                  <p className="text-xs text-faint">Searching…</p>
                ) : null}
                {seriesHits.length > 0 ? (
                  <ul className="max-h-40 overflow-y-auto rounded-xl border border-line bg-surface">
                    {seriesHits.map((hit) => (
                      <li key={hit.id}>
                        <button
                          type="button"
                          className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-surface-2"
                          onClick={() => selectSeries(hit)}
                        >
                          <span className="font-medium text-ink">
                            {hit.canonicalTitle}
                          </span>
                          <span className="text-xs text-muted">
                            primary {hit.anilistPrimaryId} · {hit.memberCount}{" "}
                            mapped anime
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div>
                <Label htmlFor="target_series_id">Target series UUID</Label>
                <Input
                  id="target_series_id"
                  name="target_series_id"
                  value={targetSeriesId}
                  onChange={(e) => setTargetSeriesId(e.target.value)}
                  placeholder="Optional if primary ID set"
                />
              </div>
              <div>
                <Label htmlFor="target_anilist_primary_id">
                  Target primary AniList ID
                </Label>
                <Input
                  id="target_anilist_primary_id"
                  name="target_anilist_primary_id"
                  value={targetAnilistPrimaryId}
                  onChange={(e) => setTargetAnilistPrimaryId(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 113415"
                />
              </div>
              {selectedSeries ? (
                <p className="text-xs text-muted">
                  Target: {selectedSeries.canonicalTitle}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this override exists"
            />
          </div>

          {saveState.error ? (
            <p className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger" role="alert">
              {saveState.error}
            </p>
          ) : null}
          {saveState.success ? (
            <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink" role="status">
              {saveState.success}
              {saveState.details ? (
                <span className="mt-1 block text-muted">{saveState.details}</span>
              ) : null}
            </p>
          ) : null}

          <Button type="submit" disabled={savePending}>
            {savePending ? "Applying…" : "Save & apply override"}
          </Button>
        </form>
      </section>

      {removeMessage?.error || removeMessage?.success ? (
        <p
          className={`rounded-xl border border-line px-3 py-2 text-sm ${
            removeMessage.error ? "text-danger" : "text-ink"
          }`}
          role="status"
        >
          {removeMessage.error ?? removeMessage.success}
          {removeMessage.details ? (
            <span className="mt-1 block text-muted">{removeMessage.details}</span>
          ) : null}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Active overrides</h2>
        {overrides.length === 0 ? (
          <p className="text-sm text-muted">No manual overrides yet.</p>
        ) : (
          <ul className="space-y-3">
            {overrides.map(({ override, animeTitle, targetSeriesTitle }) => (
              <li
                key={override.id}
                className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-ink">
                    {animeTitle ?? `AniList ${override.anilist_id}`}
                  </p>
                  <p className="text-sm text-muted">
                    AniList {override.anilist_id} ·{" "}
                    {ACTION_LABELS[override.action] ?? override.action}
                    {targetSeriesTitle
                      ? ` → ${targetSeriesTitle}`
                      : override.target_anilist_primary_id
                        ? ` → primary ${override.target_anilist_primary_id}`
                        : ""}
                  </p>
                  {override.notes ? (
                    <p className="text-xs text-faint">{override.notes}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isRemoving}
                  onClick={() => handleRemove(override.anilist_id)}
                >
                  Remove & re-auto
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
