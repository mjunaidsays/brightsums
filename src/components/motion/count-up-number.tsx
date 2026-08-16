"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionSafe } from "./reduced-motion-provider";

/**
 * Animates a number counting up from its previous value to `value` over
 * `durationMs`. Used for the header point counter, dashboard stats, and the
 * end-of-quiz score reveal. Jumps instantly when motion is unsafe.
 */
export function CountUpNumber({
  value,
  durationMs = 600,
  className,
  format = (n: number) => Math.round(n).toString(),
}: {
  value: number;
  durationMs?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const motionSafe = useMotionSafe();
  const [displayValue, setDisplayValue] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    if (!motionSafe || from === to) {
      setDisplayValue(to);
      fromRef.current = to;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, motionSafe, durationMs]);

  return <span className={className}>{format(displayValue)}</span>;
}
