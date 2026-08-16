"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useMotionSafe } from "./reduced-motion-provider";

/**
 * Fires a confetti burst once on mount (e.g. the quiz-complete summary
 * screen). No-op when prefers-reduced-motion is set. Renders nothing itself
 * — canvas-confetti draws to a full-viewport canvas it manages.
 */
export function ConfettiTrigger({ fire = true }: { fire?: boolean }) {
  const motionSafe = useMotionSafe();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!fire || !motionSafe || hasFired.current) return;
    hasFired.current = true;

    const duration = 1200;
    const end = Date.now() + duration;
    const colors = ["#f97316", "#ec4899", "#facc15", "#22c55e"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [fire, motionSafe]);

  return null;
}
