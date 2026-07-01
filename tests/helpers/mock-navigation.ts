import { mock } from "node:test";
import { useSyncExternalStore } from "react";

import type { MockRouter } from "./mock-router";

/**
 * Registers a `next/navigation` module mock covering `useRouter`,
 * `usePathname`, and `useSearchParams` for this test file. Use instead of
 * `installRouterMock` when the component under test also reads the path or
 * query string. Call once per file, before dynamically importing the
 * component(s) under test.
 *
 * `router.push`/`router.replace` update the underlying pathname/search state
 * and re-render subscribers by default (mirroring real client-side
 * navigation), so components that round-trip through the URL (read a param,
 * navigate, re-render with the new param) work without extra wiring. Tests
 * that only care about the navigated-to href can still override
 * `router.replace`/`router.push` per test — that trades away the
 * auto-update behavior for that test only.
 */
export function installNavigationMock(
  initial: { pathname?: string; search?: string } = {},
) {
  let pathname = initial.pathname ?? "/library";
  let searchParams = new URLSearchParams(initial.search ?? "");
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) listener();
  }

  function applyHref(href: string) {
    const [path, qs] = href.split("?");
    pathname = path || "/";
    searchParams = new URLSearchParams(qs ?? "");
    notify();
  }

  const router: MockRouter = {
    push: (href) => applyHref(href),
    replace: (href) => applyHref(href),
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  };

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => router,
      usePathname: () => useSyncExternalStore(subscribe, () => pathname),
      useSearchParams: () => useSyncExternalStore(subscribe, () => searchParams),
    },
  });

  return {
    router,
    setPathname: (next: string) => {
      pathname = next;
      notify();
    },
    setSearchParams: (next: string | URLSearchParams) => {
      searchParams = new URLSearchParams(next);
      notify();
    },
  };
}
