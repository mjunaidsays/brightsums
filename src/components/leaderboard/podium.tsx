"use client";

import { motion } from "framer-motion";
import type { LeaderboardRow } from "@/server/db/queries/leaderboard.queries";
import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/reduced-motion-provider";

const MEDAL = ["🥇", "🥈", "🥉"];
const HEIGHTS = ["h-28", "h-20", "h-16"];
const ORDER = [1, 0, 2]; // display 2nd, 1st, 3rd for the classic podium silhouette

export function Podium({ topThree }: { topThree: LeaderboardRow[] }) {
  const motionSafe = useMotionSafe();
  if (topThree.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-4 py-6">
      {ORDER.filter((i) => topThree[i]).map((i, orderPosition) => {
        const row = topThree[i];
        return (
          <motion.div
            key={row.userId}
            initial={motionSafe ? { opacity: 0, y: 24, scale: 0.8 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: motionSafe ? 0.1 * orderPosition : 0,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-3xl">{MEDAL[i]}</span>
            <span className="max-w-24 truncate text-center font-display font-bold">
              {row.fullName}
            </span>
            <span className="text-xs text-muted-foreground">{row.schoolName}</span>
            <div
              className={cn(
                "flex w-24 items-end justify-center rounded-t-[var(--radius-control)] bg-primary-500 pb-2 font-display text-xl font-extrabold text-white",
                HEIGHTS[i]
              )}
            >
              {row.bestScore}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
