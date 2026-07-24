"use client";

import { useEffect } from "react";

import { syncProfileTimezone } from "@/actions/profile";

export function TimezoneSync({
  current,
}: {
  current: string | null | undefined;
}) {
  useEffect(() => {
    // Older serialized/test profile shapes may not include this newly added
    // field. Wait for a current profile instead of treating absence as unsynced.
    if (current === undefined) return;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && timezone !== current) {
      void syncProfileTimezone(timezone);
    }
  }, [current]);

  return null;
}
