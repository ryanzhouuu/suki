"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Home is the only app route that opts into the dark cinematic canvas. */
export function useCinematicHome() {
  return usePathname() === "/home";
}

export function CinematicFrame({ children }: { children: ReactNode }) {
  const home = useCinematicHome();
  return (
    <div className={home ? "cinematic flex min-h-full flex-col" : "flex min-h-full flex-col"}>
      {children}
    </div>
  );
}

/**
 * Transparent over the home hero, then a dark blur once the page scrolls.
 * Every other route keeps the dark blurred header pinned from the start.
 */
export function AppHeader({ children }: { children: ReactNode }) {
  const home = useCinematicHome();
  const [raised, setRaised] = useState(false);

  useEffect(() => {
    if (!home) return;
    const onScroll = () => setRaised(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [home]);

  return (
    <header
      className={
        home
          ? `cinematic-header fixed inset-x-0 top-0 z-30 pt-[env(safe-area-inset-top)] ${
              raised
                ? "border-b border-line bg-paper/85 backdrop-blur-md"
                : "border-b border-transparent bg-transparent"
            }`
          : "sticky top-0 z-30 border-b border-line bg-paper/85 pt-[env(safe-area-inset-top)] backdrop-blur-md"
      }
    >
      {children}
    </header>
  );
}

/** Home content is full-bleed so the hero can sit under the header. */
export function AppMain({ children }: { children: ReactNode }) {
  const home = useCinematicHome();
  return (
    <main
      className={
        home
          ? "app-main w-full min-w-0 flex-1"
          : "app-main mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6 sm:py-10"
      }
    >
      {children}
    </main>
  );
}
