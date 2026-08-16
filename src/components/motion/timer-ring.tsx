"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionSafe } from "./reduced-motion-provider";
import { QUESTION_TIME_LIMIT_MS } from "@/lib/constants";

const GREEN: [number, number, number] = [34, 197, 94]; // --color-success-500
const AMBER: [number, number, number] = [245, 158, 11]; // --color-amber-500
const RED: [number, number, number] = [239, 68, 68]; // --color-danger-500

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** fraction: 1 = full time remaining, 0 = none. Green -> amber -> red. */
function colorForFraction(fraction: number): string {
  const clamped = Math.max(0, Math.min(1, fraction));
  const [from, to, t] =
    clamped > 0.5
      ? [GREEN, AMBER, (1 - clamped) * 2]
      : [AMBER, RED, (0.5 - clamped) * 2];
  const [r, g, b] = [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * Countdown ring driven by a server-issued `deadlineAt`. This is a DISPLAY
 * ONLY component — correctness is decided server-side (see
 * server/quiz/engine.ts's isPastDeadline). Calls `onExpire` once when it
 * locally detects time has run out, which the quiz-screen state machine uses
 * to drive the "Time's Up!" UI immediately rather than waiting on a round
 * trip; the server independently re-verifies lateness regardless.
 */
export function TimerRing({
  deadlineAt,
  totalMs = QUESTION_TIME_LIMIT_MS,
  onExpire,
  paused = false,
  size = 96,
  strokeWidth = 8,
}: {
  deadlineAt: Date;
  totalMs?: number;
  onExpire?: () => void;
  paused?: boolean;
  size?: number;
  strokeWidth?: number;
}) {
  const motionSafe = useMotionSafe();
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, deadlineAt.getTime() - Date.now())
  );
  const hasExpired = useRef(false);
  const frameRef = useRef<number | undefined>(undefined);
  // Always call the latest onExpire, even if the RAF loop below was started
  // by an earlier render — avoids a stale closure calling an outdated
  // callback if this prop ever changes mid-question. Synced via its own
  // effect (assigning a ref is not state, so this doesn't trigger a render).
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Caller (quiz-screen.tsx) mounts a fresh TimerRing per question via
  // `key={question.orderIndex}`, so this effect only ever runs for a
  // question this exact deadline belongs to — the useState initializer
  // above already computed the correct starting remainingMs at mount, this
  // just drives the ongoing per-frame countdown.
  useEffect(() => {
    hasExpired.current = false;

    function tick() {
      const remaining = Math.max(0, deadlineAt.getTime() - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        if (!hasExpired.current) {
          hasExpired.current = true;
          onExpireRef.current?.();
        }
        return;
      }
      if (!paused) frameRef.current = requestAnimationFrame(tick);
    }

    if (!paused) {
      frameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [deadlineAt, paused]);

  const fraction = Math.max(0, Math.min(1, remainingMs / totalMs));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);
  const color = colorForFraction(fraction);
  const seconds = Math.ceil(remainingMs / 1000);
  const isUrgent = fraction <= 0.25;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${seconds} seconds remaining`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            // stroke-dashoffset is already driven smoothly by the RAF loop
            // above (60fps), so it must NOT also have a CSS transition —
            // two competing animation systems on the same property causes
            // the browser to visually "chase" a constantly-moving target
            // and can render as stuck/frozen until an unrelated re-render
            // (e.g. answering) forces a fresh paint. Only `stroke` (the
            // green->amber->red color) benefits from a transition, since it
            // changes far less often.
            transition: motionSafe ? "stroke 0.3s linear" : "none",
          }}
        />
      </svg>
      <span
        className={
          "absolute font-display text-2xl font-extrabold" +
          (motionSafe && isUrgent ? " animate-pulse" : "")
        }
        style={{ color }}
      >
        {seconds}
      </span>
    </div>
  );
}
