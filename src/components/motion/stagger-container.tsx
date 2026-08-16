"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionSafe } from "./reduced-motion-provider";

const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const staggerParentReduced: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0, delayChildren: 0 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const staggerItemReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.001 } },
};

/**
 * Wraps children (e.g. a question then its options) with a stagger-in
 * animation. Each direct child should be a motion element using the
 * `staggerItem` variant (or import `useMotionSafe` itself for custom
 * children). Falls back to a simultaneous fade when prefers-reduced-motion
 * is set, per CLAUDE.md section 8.3 — never a jarring skip of the stagger effect.
 */
export function StaggerContainer({
  children,
  className,
  onAnimationComplete,
}: {
  children: ReactNode;
  className?: string;
  onAnimationComplete?: () => void;
}) {
  const motionSafe = useMotionSafe();
  return (
    <motion.div
      className={className}
      variants={motionSafe ? staggerParent : staggerParentReduced}
      initial="hidden"
      animate="show"
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const motionSafe = useMotionSafe();
  return (
    <motion.div className={className} variants={motionSafe ? staggerItem : staggerItemReduced}>
      {children}
    </motion.div>
  );
}
