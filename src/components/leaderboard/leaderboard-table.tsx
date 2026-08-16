"use client";

import { motion } from "framer-motion";
import type { LeaderboardRow } from "@/server/db/queries/leaderboard.queries";
import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/reduced-motion-provider";

export function LeaderboardTable({
  rows,
  currentUserId,
}: {
  rows: LeaderboardRow[];
  currentUserId?: string;
}) {
  const motionSafe = useMotionSafe();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-control)] bg-muted py-10 text-center">
        <span className="text-3xl">🏆</span>
        <p className="font-bold text-muted-foreground">No contest scores yet — be the first!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-control)] border-2 border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-primary-500 text-white">
            <th className="px-4 py-3 font-display">Rank</th>
            <th className="px-4 py-3 font-display">Name</th>
            <th className="px-4 py-3 font-display">School</th>
            <th className="px-4 py-3 font-display">City</th>
            <th className="px-4 py-3 font-display">Score</th>
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: motionSafe ? 0.05 : 0 } } }}
        >
          {rows.map((row) => {
            const isMe = row.userId === currentUserId;
            return (
              <motion.tr
                key={row.userId}
                variants={{
                  hidden: { opacity: 0, x: motionSafe ? -12 : 0 },
                  show: { opacity: 1, x: 0, transition: { duration: motionSafe ? 0.3 : 0 } },
                }}
                className={cn("border-t border-border", isMe && "bg-tertiary-200/40")}
              >
                <td className="px-4 py-3 font-display font-extrabold text-primary-600">
                  #{row.rank}
                  {isMe && <span className="ml-1 text-xs font-bold text-secondary-600">(you)</span>}
                </td>
                <td className="px-4 py-3 font-bold">{row.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.schoolName}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.city ?? "—"}</td>
                <td className="px-4 py-3 font-bold text-success-600">{row.bestScore}/100</td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}
