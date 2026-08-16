"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const ReducedMotionContext = createContext(false);

function readPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Exposes `motionSafe` (true = animations allowed) via context, driven by the
 * OS-level `prefers-reduced-motion` setting. Every animation primitive in
 * components/motion/* reads this and swaps stagger/bounce/confetti for plain
 * fades or instant transitions when false — built in from day one per
 * CLAUDE.md §8.3, not retrofitted later.
 *
 * Initial value is read lazily in useState's initializer (safe on both
 * server and client — window is undefined during SSR, so it just defaults
 * true there and corrects on client mount via the media-query's initial
 * read). The effect below only SUBSCRIBES to future changes; it never
 * calls setState synchronously on mount itself.
 */
export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [motionSafe, setMotionSafe] = useState(() => !readPrefersReducedMotion());

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => setMotionSafe(!event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return (
    <ReducedMotionContext.Provider value={motionSafe}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useMotionSafe() {
  return useContext(ReducedMotionContext);
}
