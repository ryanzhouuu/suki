"use client";

import { useEffect } from "react";

import { syncProfileTimezone } from "@/actions/profile";

export function TimezoneSync({ current }: { current: string | null }) {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && timezone !== current) {
      void syncProfileTimezone(timezone);
    }
  }, [current]);

  return null;
}

