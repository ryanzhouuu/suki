"use client";

import { useState } from "react";

type ShareButtonProps = {
  url: string;
  title?: string;
  text?: string;
  label?: string;
};

export function ShareButton({
  url,
  title,
  text,
  label = "Share",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // User dismissed the native sheet — not an error worth surfacing.
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Otherwise fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — nothing more we can do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`Share profile link${title ? `: ${title}` : ""}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-medium text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-ink"
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
      {copied ? "Link copied" : label}
    </button>
  );
}
