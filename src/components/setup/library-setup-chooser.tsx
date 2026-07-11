"use client";

import { useState } from "react";

import { QuickAddPanel } from "@/components/setup/quick-add-panel";
import { LibrarySetupImportForm } from "@/components/setup/library-setup-import-form";

type SetupPath = "anilist" | "mal_xml" | "quick_add";

const PATHS: {
  key: SetupPath;
  label: string;
  blurb: string;
  recommended?: boolean;
}[] = [
  {
    key: "anilist",
    label: "Import from AniList",
    blurb: "Pull your public list by username — recommended if you have one.",
    recommended: true,
  },
  {
    key: "mal_xml",
    label: "Import from MyAnimeList",
    blurb: "Upload your MAL XML export.",
  },
  {
    key: "quick_add",
    label: "Add manually",
    blurb: "Search and add a few favorites without an existing list.",
  },
];

type LibrarySetupChooserProps = {
  showRecoveryHint?: boolean;
};

export function LibrarySetupChooser({
  showRecoveryHint = false,
}: LibrarySetupChooserProps) {
  const [path, setPath] = useState<SetupPath | null>(null);

  if (path === "quick_add") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPath(null)}
          className="text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          ← Back to setup options
        </button>
        <QuickAddPanel />
      </div>
    );
  }

  if (path === "anilist" || path === "mal_xml") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPath(null)}
          className="text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          ← Back to setup options
        </button>
        <LibrarySetupImportForm initialSource={path} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showRecoveryHint ? (
        <p className="text-sm text-muted">
          Your last import did not finish. Try again, or add anime manually
          below.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Choose how you want to bring anime into Suki.
        </p>
      )}

      <div className="grid gap-3">
        {PATHS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setPath(option.key)}
            className="rounded-card border border-line-strong bg-surface p-4 text-left transition-colors hover:border-accent"
          >
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">
                {option.label}
              </span>
              {option.recommended ? (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Recommended
                </span>
              ) : null}
            </span>
            <span className="mt-1 block text-xs text-muted">{option.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
