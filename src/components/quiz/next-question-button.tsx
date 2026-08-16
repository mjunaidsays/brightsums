"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function NextQuestionButton({
  onClick,
  isLast,
  loading,
}: {
  onClick: () => void;
  isLast: boolean;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end"
    >
      <Button size="lg" onClick={onClick} disabled={loading}>
        {loading ? "Loading..." : isLast ? "See Results 🎉" : "Next Question →"}
      </Button>
    </motion.div>
  );
}
