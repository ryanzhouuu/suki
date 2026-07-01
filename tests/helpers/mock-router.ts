import { mock } from "node:test";

export type MockRouter = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (href: string) => void;
};

/**
 * Registers a `next/navigation` module mock for this test file and returns
 * the mutable router object `useRouter()` will resolve to. Because the
 * component under test is dynamically imported once and its `useRouter`
 * binding is fixed at that point, reassign methods on the returned object
 * per-test rather than re-registering the mock.
 *
 * Call once per test file, before dynamically importing the component(s)
 * under test.
 */
export function installRouterMock(): MockRouter {
  const router: MockRouter = {
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  };

  mock.module("next/navigation", {
    namedExports: { useRouter: () => router },
  });

  return router;
}
