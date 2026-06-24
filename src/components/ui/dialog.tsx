"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Tailwind max-width class for the desktop panel. Defaults to `max-w-lg`. */
  maxWidthClassName?: string;
};

/**
 * Lightweight accessible modal shell matching the app's surface tokens.
 * Renders as a bottom sheet on mobile and a centered modal on desktop.
 * Closes on backdrop click and Escape, locks body scroll while open, and
 * traps initial focus on the panel.
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-lg",
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose without making the open-effect depend on its
  // identity — callers commonly pass a fresh function each render.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Runs once per open: lock body scroll, wire Escape, and move focus into the
  // panel. Depends only on `open` so ordinary re-renders (e.g. typing in a
  // field inside the dialog) don't re-run it and steal focus from inputs.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Portal to <body> so the overlay escapes any ancestor stacking context
  // (e.g. a `relative z-10` content wrapper) and sits above the sticky header
  // (z-30) and mobile nav (z-20).
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      // position/inset/z-index are inline because the app's *unlayered*
      // `body > * { position: relative; z-index: 1 }` rule (globals.css) would
      // otherwise override the *layered* Tailwind `fixed`/`z-50` utilities once
      // this overlay is portaled to <body>, dropping it into normal flow at the
      // bottom of the page. Inline styles win over that unlayered rule.
      style={{ position: "fixed", inset: 0, zIndex: 50 }}
      className="flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm animate-fade sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-[90dvh] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-t-card border border-line bg-paper shadow-[0_30px_80px_-30px_rgb(var(--shadow-color)/0.7)] outline-none animate-rise sm:rounded-card`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
