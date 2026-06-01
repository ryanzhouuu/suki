"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Local input state synced to a URL search param after debounce.
 * `urlValue` is the committed value from the URL (use for filtering).
 */
export function useDebouncedUrlParam(param: string, delayMs = 300) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(param) ?? "";
  const [value, setValue] = useState(urlValue);
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);

  if (urlValue !== lastUrlValue) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === urlValue.trim()) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set(param, trimmed);
      } else {
        params.delete(param);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, urlValue, param, delayMs, pathname, router, searchParams]);

  return { value, setValue, urlValue };
}
