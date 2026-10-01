"use client";

/** Owns ranking export interactions; profile-link sharing stays in ShareButton. */
import { useRef, useState } from "react";

import { ShareButton } from "@/components/share/share-button";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { RankingTextExport } from "@/lib/ranking/export";

type RankingShareButtonProps = {
  url: string;
  rankingExport: RankingTextExport;
};

/** Offers the full ranking as text even when the page displays a filtered view. */
export function RankingShareButton({ url, rankingExport }: RankingShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasRankings = rankingExport.count > 0;

  /** Restores focus to the Share trigger when the dialog closes. */
  function closeDialog() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  /** Leaves the preview available for manual copying if clipboard access fails. */
  async function copyRanking() {
    try {
      await navigator.clipboard.writeText(rankingExport.text);
      setStatus("Ranking copied");
    } catch {
      setStatus("Could not copy. Select and copy the ranking below, or download it.");
    }
  }

  /** Downloads a UTF-8 file and releases its temporary browser URL afterward. */
  function downloadRanking() {
    let objectUrl: string | undefined;
    const link = document.createElement("a");
    try {
      objectUrl = URL.createObjectURL(
        new Blob([rankingExport.text], { type: "text/plain;charset=utf-8" }),
      );
      link.href = objectUrl;
      link.download = rankingExport.filename;
      document.body.appendChild(link);
      link.click();
      setStatus("Ranking download started");
    } catch {
      setStatus("Could not download. Select and copy the ranking below.");
    } finally {
      link.remove();
      if (objectUrl) {
        const urlToRevoke = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 1000);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-medium text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-ink"
        aria-label="Share rankings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setStatus("");
          setOpen(true);
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Share
      </button>
      <Dialog open={open} onClose={closeDialog} title="Share your ranking">
        <div className="space-y-4">
          <ShareButton
            url={url}
            title="My anime rankings on Suki"
            label="Share profile link"
          />
          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-sm text-muted">
              {hasRankings
                ? `Export all ${rankingExport.count} ranked series, regardless of your current filters or view.`
                : "Complete anime and compare series to build an exportable ranking."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyRanking} disabled={!hasRankings} size="sm">
                Copy numbered ranking
              </Button>
              <Button onClick={downloadRanking} disabled={!hasRankings} variant="secondary" size="sm">
                Download .txt
              </Button>
            </div>
            <p role="status" className="text-sm text-muted">{status}</p>
            {hasRankings ? (
              <label className="block text-sm font-medium text-ink">
                Full numbered ranking
                <textarea
                  readOnly
                  value={rankingExport.text}
                  rows={8}
                  className="mt-2 block w-full resize-y rounded-card border border-line bg-surface p-3 text-sm font-normal text-ink focus-visible:outline-2 focus-visible:outline-accent"
                />
              </label>
            ) : null}
          </div>
        </div>
      </Dialog>
    </>
  );
}
