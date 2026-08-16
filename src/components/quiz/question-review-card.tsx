import { Card } from "@/components/ui/card";
import type { QuestionReview } from "@/server/quiz/session-store";
import { cn, formatDuration } from "@/lib/utils";
import { OPTION_VISUAL_CLASSES, type OptionVisualState } from "./option-visuals";
import { OPTION_LETTERS } from "@/lib/constants";

function verdictFor(review: QuestionReview): { label: string; className: string; icon: string } {
  if (review.timedOut) {
    return { label: "Time ran out for this question.", className: "text-danger-600", icon: "⏰" };
  }
  if (review.isCorrect) {
    return { label: "Your answer for this question was right!", className: "text-success-600", icon: "✅" };
  }
  return { label: "Your answer for this question was wrong.", className: "text-danger-600", icon: "❌" };
}

// Review options are always in a "final" state (never idle — the quiz is
// over), sharing the exact correct/incorrect/muted classes from
// option-visuals.ts so the live quiz and this review never visually drift.
function optionStateFor(review: QuestionReview, index: number): OptionVisualState {
  if (index === review.correctOptionIndex) return "correct";
  if (index === review.selectedOptionIndex && index !== review.correctOptionIndex) return "incorrect";
  return "muted";
}

export function QuestionReviewCard({ review }: { review: QuestionReview }) {
  const verdict = verdictFor(review);

  return (
    <Card className="gap-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-bold text-muted-foreground">
            Question {review.orderIndex + 1}
          </span>
          <h3 className="font-display text-lg font-bold">{review.questionText}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-[var(--radius-pill)] bg-muted px-3 py-1 text-sm font-bold whitespace-nowrap",
              verdict.className
            )}
          >
            {verdict.icon} {review.timedOut ? "Time's Up" : review.isCorrect ? "Correct" : "Incorrect"}
          </span>
          {review.timeTakenMs !== null && (
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              ⏱ {formatDuration(review.timeTakenMs)}
            </span>
          )}
        </div>
      </div>

      <p className={cn("font-bold", verdict.className)}>{verdict.label}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {review.options.map((option, index) => (
          <div
            key={index}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] px-5 py-3 font-display text-base font-bold",
              OPTION_VISUAL_CLASSES[optionStateFor(review, index)]
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current text-sm">
              {OPTION_LETTERS[index]}
            </span>
            <span>{option}</span>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-control)] border-2 border-tertiary-200 bg-tertiary-200/30 p-4 text-base leading-relaxed">
        <span className="font-bold">Why: </span>
        {review.explanation}
      </div>
    </Card>
  );
}
