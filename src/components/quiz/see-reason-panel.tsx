"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useMotionSafe } from "@/components/motion/reduced-motion-provider";

export function SeeReasonPanel({ explanation }: { explanation: string }) {
  const [open, setOpen] = useState(false);
  const motionSafe = useMotionSafe();

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide Reason" : "See Reason 💡"}
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: motionSafe ? 0.3 : 0.001 }}
            className="overflow-hidden"
          >
            <div className="rounded-[var(--radius-control)] border-2 border-tertiary-200 bg-tertiary-200/30 p-4 text-base leading-relaxed">
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
