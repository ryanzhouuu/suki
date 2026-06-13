"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  /** Where to go when there's no in-app history to return to. */
  fallbackHref: string;
  className?: string;
};

export function BackButton({ fallbackHref, className }: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    // Return to wherever the user came from; fall back when this page was
    // opened directly (fresh tab / external link) and there's no history.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      ← Back
    </button>
  );
}
