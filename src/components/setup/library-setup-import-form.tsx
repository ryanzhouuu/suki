"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { startImport, type StartImportState } from "@/actions/imports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImportSource } from "@/lib/imports/types";

const SETUP_SOURCES: {
  key: ImportSource;
  label: string;
  blurb: string;
}[] = [
  {
    key: "anilist",
    label: "AniList",
    blurb: "Pull your list by username — the fastest path.",
  },
  {
    key: "mal_xml",
    label: "MyAnimeList",
    blurb: "Upload your MAL XML export.",
  },
];

export function LibrarySetupImportForm({
  initialSource = "anilist",
}: {
  initialSource?: ImportSource;
}) {
  const router = useRouter();
  const [source, setSource] = useState<ImportSource>(initialSource);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<
    StartImportState,
    FormData
  >(startImport, {});

  useEffect(() => {
    if (state.jobId) router.refresh();
  }, [state.jobId, router]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {SETUP_SOURCES.map((option) => {
          const active = source === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setSource(option.key)}
              className={`rounded-card border p-4 text-left transition-colors ${
                active
                  ? "border-accent bg-accent-soft"
                  : "border-line-strong bg-surface hover:border-accent"
              }`}
            >
              <span className="block text-sm font-semibold text-ink">
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {option.blurb}
              </span>
            </button>
          );
        })}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="source" value={source} />

        {source === "anilist" ? (
          <div>
            <Label htmlFor="setup-anilist-username">AniList username</Label>
            <Input
              id="setup-anilist-username"
              name="username"
              placeholder="your_anilist_name"
              autoComplete="off"
              required
            />
            <p className="mt-1.5 text-xs text-faint">
              Your AniList list must be public.
            </p>
          </div>
        ) : null}

        {source === "mal_xml" ? (
          <div>
            <Label htmlFor="setup-mal-file">MyAnimeList export (.xml)</Label>
            <input
              ref={fileRef}
              id="setup-mal-file"
              name="file"
              type="file"
              accept=".xml,text/xml,application/xml"
              required
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line-strong file:bg-surface file:px-4 file:py-2 file:text-sm file:text-ink hover:file:border-accent"
            />
            <p className="mt-1.5 text-xs text-faint">
              Export from MyAnimeList → List → Export. Unzip the .gz first.
            </p>
          </div>
        ) : null}

        {state.error ? (
          <p
            className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Starting…" : "Start import"}
        </Button>
      </form>
    </div>
  );
}
