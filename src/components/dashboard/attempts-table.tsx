"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMotionSafe } from "@/components/motion/reduced-motion-provider";
import { POINTS_PER_QUESTION } from "@/lib/constants";

type AttemptRow = {
  id: string;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  percentage: string | number;
  createdAt: Date | string;
};

export function AttemptsTable({
  attempts,
  emptyLabel,
  emptyIcon = "📋",
}: {
  attempts: AttemptRow[];
  emptyLabel: string;
  emptyIcon?: string;
}) {
  const motionSafe = useMotionSafe();

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[var(--radius-control)] bg-muted py-10 text-center">
        <span className="text-3xl">{emptyIcon}</span>
        <p className="font-bold text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm font-bold text-muted-foreground">
            <th className="pb-2">Attempt</th>
            <th className="pb-2">Score</th>
            <th className="pb-2">Percentage</th>
            <th className="pb-2">Date &amp; Time</th>
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: motionSafe ? 0.04 : 0 } } }}
        >
          {attempts.map((a) => (
            <motion.tr
              key={a.id}
              variants={{
                hidden: { opacity: 0, y: motionSafe ? 6 : 0 },
                show: { opacity: 1, y: 0, transition: { duration: motionSafe ? 0.25 : 0 } },
              }}
              className="border-t border-border"
            >
              <td className="py-2 font-bold text-primary-600">{a.attemptNumber}</td>
              <td className="py-2 font-bold">{a.score}/{a.totalQuestions * POINTS_PER_QUESTION}</td>
              <td className="py-2 font-bold text-success-600">{a.percentage}%</td>
              <td className="py-2 text-muted-foreground whitespace-nowrap">
                {/* Fixed locale (not `undefined`) — the server and the browser can
                    resolve different default locales, which produces different
                    formatted strings for the same Date and triggers a hydration
                    mismatch. Pinning "en-US" guarantees identical SSR/client output. */}
                {new Date(a.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

export function SeeAllLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-bold text-primary-600 underline">
      See All Attempts →
    </Link>
  );
}
