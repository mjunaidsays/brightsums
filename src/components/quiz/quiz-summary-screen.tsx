"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfettiTrigger } from "@/components/motion/confetti-trigger";
import { CountUpNumber } from "@/components/motion/count-up-number";
import { Mascot } from "@/components/motion/mascot";
import { QuestionReviewCard } from "./question-review-card";
import { POINTS_PER_QUESTION } from "@/lib/constants";
import { cn, formatDuration } from "@/lib/utils";
import type { QuestionReview } from "@/server/quiz/session-store";

export type QuizSummary = {
  score: number;
  correctCount: number;
  percentage: number;
  totalQuestions: number;
  totalTimeMs: number;
  breakdown: boolean[];
  reviews?: QuestionReview[];
};

export function QuizSummaryScreen({
  summary,
  onDone,
  doneLabel = "Back to Dashboard",
}: {
  summary: QuizSummary;
  onDone: () => void;
  doneLabel?: string;
}) {
  const celebratory = summary.percentage >= 70;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 py-10">
      <ConfettiTrigger fire={celebratory} />
      <div className="flex w-full flex-col items-center gap-6 text-center">
        <Mascot mood={celebratory ? "celebrating" : "sad"} size={104} />
        <h1 className="font-display text-3xl font-extrabold">
          {celebratory ? "Great job!" : "Nice try!"}
        </h1>

        <Card className="w-full max-w-lg items-center gap-1 py-8">
          <span className="text-sm font-bold text-muted-foreground">Your Score</span>
          <div className="flex items-baseline gap-1">
            <CountUpNumber
              value={summary.score}
              className="font-display text-6xl font-extrabold text-primary-600"
            />
            <span className="font-display text-2xl font-bold text-muted-foreground">
              /{summary.totalQuestions * POINTS_PER_QUESTION}
            </span>
          </div>
          <span className="text-lg font-bold text-muted-foreground">
            {summary.correctCount}/{summary.totalQuestions} correct · {summary.percentage}%
          </span>
          <span className="text-sm font-bold text-muted-foreground">
            ⏱ Time Taken: {formatDuration(summary.totalTimeMs)}
          </span>
        </Card>

        <div className="flex gap-2">
          {summary.breakdown.map((correct, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 300, damping: 15 }}
              className={cn("size-6 rounded-full", correct ? "bg-success-500" : "bg-danger-500")}
              aria-label={correct ? "correct" : "incorrect"}
            />
          ))}
        </div>
      </div>

      {summary.reviews && summary.reviews.length > 0 && (
        <div className="flex w-full flex-col gap-4">
          <h2 className="font-display text-xl font-bold">Review Your Answers</h2>
          {summary.reviews.map((review) => (
            <QuestionReviewCard key={review.orderIndex} review={review} />
          ))}
        </div>
      )}

      <Button size="lg" onClick={onDone}>
        {doneLabel}
      </Button>
    </div>
  );
}
