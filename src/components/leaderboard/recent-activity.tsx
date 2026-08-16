"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useMotionSafe } from "@/components/motion/reduced-motion-provider";
import type { RecentActivityRow } from "@/server/db/queries/leaderboard.queries";

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity({ rows }: { rows: RecentActivityRow[] }) {
  const motionSafe = useMotionSafe();
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity 🔥</CardTitle>
      </CardHeader>
      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: motionSafe ? 0.05 : 0 } } }}
        className="flex flex-col gap-2"
      >
        {rows.map((row, i) => (
          <motion.li
            key={`${row.userId}-${row.createdAt.getTime()}-${i}`}
            variants={{
              hidden: { opacity: 0, x: motionSafe ? -10 : 0 },
              show: { opacity: 1, x: 0, transition: { duration: motionSafe ? 0.25 : 0 } },
            }}
            className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-muted px-3 py-2 text-sm"
          >
            <span>
              <span className="font-bold">{row.fullName}</span> scored{" "}
              <span className="font-bold text-success-600">{row.score}</span>
              {row.roundName ? (
                <>
                  {" "}
                  in <span className="font-bold">{row.roundName}</span>
                </>
              ) : null}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(row.createdAt)}</span>
          </motion.li>
        ))}
      </motion.ul>
    </Card>
  );
}
