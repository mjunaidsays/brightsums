"use client";

import { motion, type TargetAndTransition } from "framer-motion";
import { useMotionSafe } from "./reduced-motion-provider";

export type MascotMood = "idle" | "happy" | "sad" | "celebrating";

/**
 * A cheap, dependency-free character: inline SVG shapes styled from our
 * existing design tokens, no external image asset to fail to load. Swaps
 * face expression per `mood` and animates via Framer Motion, respecting
 * useMotionSafe() like every other motion primitive — degrades to a static
 * pose (still with the correct expression) under prefers-reduced-motion.
 */
export function Mascot({
  mood = "idle",
  size = 64,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  const motionSafe = useMotionSafe();

  const bodyMotion = motionSafe
    ? (
        {
          idle: { y: [0, -4, 0], rotate: 0, scale: 1, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
          happy: { y: [0, -10, 0], rotate: 0, scale: 1.05, transition: { duration: 0.5, repeat: 2, ease: "easeOut" } },
          sad: { y: 2, rotate: -4, scale: 0.97, transition: { duration: 0.4, ease: "easeOut" } },
          celebrating: {
            y: [0, -14, 0],
            rotate: [0, -8, 8, -8, 0],
            scale: [1, 1.15, 1],
            transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
          },
        } satisfies Record<MascotMood, TargetAndTransition>
      )[mood]
    : undefined;

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`BrightSums mascot, feeling ${mood}`}
      animate={bodyMotion}
    >
      {/* body */}
      <circle cx="50" cy="54" r="38" fill="var(--color-primary-400)" stroke="var(--color-primary-600)" strokeWidth="3" />
      {/* cheeks */}
      <circle cx="26" cy="60" r="6" fill="var(--color-secondary-300)" opacity="0.7" />
      <circle cx="74" cy="60" r="6" fill="var(--color-secondary-300)" opacity="0.7" />
      {/* eyes */}
      {mood === "sad" ? (
        <>
          <path d="M 32 44 Q 37 40 42 44" stroke="#2b2118" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 58 44 Q 63 40 68 44" stroke="#2b2118" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="37" cy="46" r="4.5" fill="#2b2118" />
          <circle cx="63" cy="46" r="4.5" fill="#2b2118" />
          {(mood === "happy" || mood === "celebrating") && (
            <>
              <circle cx="38.5" cy="44.5" r="1.3" fill="white" />
              <circle cx="64.5" cy="44.5" r="1.3" fill="white" />
            </>
          )}
        </>
      )}
      {/* mouth */}
      {mood === "sad" ? (
        <path d="M 38 68 Q 50 60 62 68" stroke="#2b2118" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      ) : mood === "happy" || mood === "celebrating" ? (
        <path
          d="M 34 62 Q 50 80 66 62"
          stroke="#2b2118"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill={mood === "celebrating" ? "var(--color-tertiary-400)" : "none"}
        />
      ) : (
        <path d="M 38 64 Q 50 70 62 64" stroke="#2b2118" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {/* celebrating sparkles */}
      {mood === "celebrating" && (
        <>
          <path d="M 12 20 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 z" fill="var(--color-tertiary-400)" />
          <path d="M 88 30 l 2 4 l 4 2 l -4 2 l -2 4 l -2 -4 l -4 -2 l 4 -2 z" fill="var(--color-secondary-500)" />
        </>
      )}
    </motion.svg>
  );
}
