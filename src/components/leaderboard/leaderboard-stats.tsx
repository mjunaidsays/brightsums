"use client";

import { motion } from "framer-motion";
import { Mascot } from "@/components/motion/mascot";
import { CountUpNumber } from "@/components/motion/count-up-number";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/reduced-motion-provider";
import type { LeaderboardStats as Stats } from "@/server/db/queries/leaderboard.queries";

type StatTheme = "primary" | "secondary" | "tertiary" | "success";

const THEME_CLASSES: Record<StatTheme, { bg: string; border: string; shadow: string; icon: string; value: string }> = {
  primary: {
    bg: "bg-primary-100",
    border: "border-primary-300",
    shadow: "shadow-[0_4px_0_0_var(--color-primary-300)]",
    icon: "bg-primary-500",
    value: "text-primary-700",
  },
  secondary: {
    bg: "bg-secondary-100",
    border: "border-secondary-300",
    shadow: "shadow-[0_4px_0_0_var(--color-secondary-300)]",
    icon: "bg-secondary-500",
    value: "text-secondary-700",
  },
  tertiary: {
    bg: "bg-tertiary-200/60",
    border: "border-tertiary-400",
    shadow: "shadow-[0_4px_0_0_var(--color-tertiary-400)]",
    icon: "bg-tertiary-400",
    value: "text-tertiary-600",
  },
  success: {
    bg: "bg-success-100",
    border: "border-success-500",
    shadow: "shadow-[0_4px_0_0_var(--color-success-500)]",
    icon: "bg-success-500",
    value: "text-success-600",
  },
};

function statItems(stats: Stats, myRank: number | null) {
  return [
    { key: "contestants", label: "Contestants", value: stats.contestantCount, suffix: "", icon: "🧑‍🎓", theme: "primary" as StatTheme },
    {
      key: "average",
      label: "Average Score",
      value: stats.averageScore ?? 0,
      suffix: stats.averageScore == null ? "" : "/100",
      icon: "📊",
      theme: "secondary" as StatTheme,
    },
    {
      key: "top",
      label: "Top Score",
      value: stats.topScore ?? 0,
      suffix: stats.topScore == null ? "" : "/100",
      icon: "🌟",
      theme: "tertiary" as StatTheme,
    },
    ...(myRank != null
      ? [{ key: "rank", label: "Your Rank", value: myRank, suffix: "", icon: "🏅", theme: "success" as StatTheme }]
      : []),
  ];
}

/** Grid of animated, color-coded stat cards — reads at a glance, matches the
 * app's raised-bevel design language used on quiz options and buttons. */
export function LeaderboardStats({ stats, myRank }: { stats: Stats; myRank: number | null }) {
  const motionSafe = useMotionSafe();
  const items = statItems(stats, myRank);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, i) => {
        const theme = THEME_CLASSES[item.theme];
        return (
          <motion.div
            key={item.key}
            initial={motionSafe ? { opacity: 0, y: 14, scale: 0.95 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={motionSafe ? { y: -3 } : undefined}
            transition={{ delay: motionSafe ? 0.06 * i : 0, type: "spring", stiffness: 300, damping: 22 }}
            className={cn(
              "flex flex-col gap-2 rounded-[var(--radius-card)] border-2 p-4",
              theme.bg,
              theme.border,
              theme.shadow
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-base shadow-sm",
                theme.icon
              )}
            >
              {item.icon}
            </span>
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </span>
            <span className={cn("font-display text-2xl font-extrabold", theme.value)}>
              <CountUpNumber value={item.value} />
              {item.suffix}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Fills the dead space below/around the podium when the leaderboard is
 * sparse (few or no contestants) — a bare table empty-state read as
 * "abandoned"; this reads as "come be one of the first."
 */
export function SparseLeaderboardBanner({ contestantCount }: { contestantCount: number }) {
  const message =
    contestantCount === 0
      ? "No one has played a contest round yet — be the very first champion!"
      : `Only ${contestantCount} student${contestantCount === 1 ? " has" : "s have"} competed so far — invite your classmates to join the board!`;

  return (
    <Card className="flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:justify-center sm:text-left">
      <Mascot mood="celebrating" size={72} />
      <p className="max-w-sm font-bold text-muted-foreground">{message}</p>
    </Card>
  );
}
