"use client";

import { useEffect, useRef } from "react";

import { logTasteFingerprintEvent } from "@/actions/fingerprint";
import {
  FINGERPRINT_TRAIT_IDS,
  FINGERPRINT_VERSION,
} from "@/lib/fingerprint/types";

const DEFAULT_SECTION_SELECTORS = [
  "[data-taste-fingerprint-section]",
  "[data-taste-fingerprint]",
  "#taste-fingerprint-section",
  "#taste-fingerprint",
] as const;

export type TasteFingerprintTrackerProps = {
  isSignedIn: boolean;
  targetProfileUserId: string;
  fingerprintVersion?: string;
  traitIds?: readonly string[];
  sectionId?: string;
  sectionSelector?: string;
};

function findObservationRoot(
  tracker: HTMLElement,
  sectionId?: string,
  sectionSelector?: string,
): HTMLElement | null {
  if (sectionId) {
    const section = document.getElementById(sectionId);
    if (section) return section;
  }

  if (sectionSelector) {
    try {
      const section = document.querySelector<HTMLElement>(sectionSelector);
      if (section) return section;
    } catch {
      // An invalid optional selector should not prevent analytics setup.
    }
  }

  for (const selector of DEFAULT_SECTION_SELECTORS) {
    const section = tracker.closest<HTMLElement>(selector);
    if (section) return section;
  }

  return tracker.closest<HTMLElement>("section");
}

function canonicalTraitIds(traitIds: readonly string[]): Set<string> {
  const knownIds = new Set(FINGERPRINT_TRAIT_IDS as readonly string[]);
  return new Set(traitIds.filter((traitId) => knownIds.has(traitId)));
}

function fireEvent(
  eventKind: "viewed" | "evidence_opened",
  targetProfileUserId: string,
  fingerprintVersion: string,
  traitId?: string,
): void {
  try {
    void logTasteFingerprintEvent({
      eventKind,
      fingerprintVersion,
      targetProfileUserId,
      traitId,
    }).catch(() => undefined);
  } catch {
    // Analytics must never affect rendering or disclosure interaction.
  }
}

export function TasteFingerprintTracker({
  isSignedIn,
  targetProfileUserId,
  fingerprintVersion = FINGERPRINT_VERSION,
  traitIds = FINGERPRINT_TRAIT_IDS,
  sectionId,
  sectionSelector,
}: TasteFingerprintTrackerProps) {
  const trackerRef = useRef<HTMLSpanElement>(null);
  const impressionSentRef = useRef(false);
  const expandedTraitIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isSignedIn) return;

    const tracker = trackerRef.current;
    if (!tracker) return;

    const root = findObservationRoot(tracker, sectionId, sectionSelector);
    if (!root) return;

    const allowedTraitIds = canonicalTraitIds(traitIds);
    const send = (eventKind: "viewed" | "evidence_opened", traitId?: string) =>
      fireEvent(eventKind, targetProfileUserId, fingerprintVersion, traitId);

    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver((entries) => {
        if (impressionSentRef.current) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          impressionSentRef.current = true;
          send("viewed");
          intersectionObserver?.disconnect();
        }
      });
      intersectionObserver.observe(root);
    }

    const detailListeners = new Map<HTMLDetailsElement, EventListener>();
    const traitIdForDetails = (details: HTMLDetailsElement): string | null => {
      const explicitTraitId =
        details.dataset.fingerprintTraitId ??
        details.dataset.tasteFingerprintTraitId ??
        details.dataset.traitId;
      if (explicitTraitId) {
        return allowedTraitIds.has(explicitTraitId) ? explicitTraitId : null;
      }
      return null;
    };

    const attachDetailsListeners = () => {
      for (const details of root.querySelectorAll<HTMLDetailsElement>("details")) {
        if (detailListeners.has(details)) continue;

        const listener: EventListener = () => {
          if (!details.open) return;
          const traitId = traitIdForDetails(details);
          if (!traitId || expandedTraitIdsRef.current.has(traitId)) return;

          expandedTraitIdsRef.current.add(traitId);
          send("evidence_opened", traitId);
        };

        details.addEventListener("toggle", listener);
        detailListeners.set(details, listener);
      }
    };

    attachDetailsListeners();

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(attachDetailsListeners);
    mutationObserver?.observe(root, { childList: true, subtree: true });

    return () => {
      intersectionObserver?.disconnect();
      mutationObserver?.disconnect();
      for (const [details, listener] of detailListeners) {
        details.removeEventListener("toggle", listener);
      }
    };
  }, [
    fingerprintVersion,
    isSignedIn,
    sectionId,
    sectionSelector,
    targetProfileUserId,
    traitIds,
  ]);

  return <span ref={trackerRef} data-taste-fingerprint-tracker aria-hidden="true" />;
}
