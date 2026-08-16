"use client";

import { StaggerItem } from "@/components/motion/stagger-container";

export function QuestionCard({
  orderIndex,
  totalQuestions,
  questionText,
}: {
  orderIndex: number;
  totalQuestions: number;
  questionText: string;
}) {
  return (
    <StaggerItem className="flex flex-col gap-2">
      <span className="text-sm font-bold text-muted-foreground">
        Question {orderIndex + 1} of {totalQuestions}
      </span>
      <h2 className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
        {questionText}
      </h2>
    </StaggerItem>
  );
}
