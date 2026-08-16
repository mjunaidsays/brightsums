"use client";

import { useActionState } from "react";
import { updateQuestion, type UpdateQuestionState } from "@/actions/admin-questions.actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import type { questions } from "@/server/db/schema";

const initialState: UpdateQuestionState = {};

export function EditQuestionForm({ question }: { question: typeof questions.$inferSelect }) {
  const boundAction = updateQuestion.bind(null, question.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const correctValue = question.options[question.correctOptionIndex];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="questionText">Question</Label>
        <textarea
          id="questionText"
          name="questionText"
          defaultValue={question.questionText}
          rows={3}
          required
          className="rounded-[var(--radius-control)] border-2 border-border bg-card p-3 text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="options">Options (comma-separated)</Label>
        <Input id="options" name="options" defaultValue={question.options.join(", ")} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="correctAnswer">Correct Answer (must exactly match one option)</Label>
        <Input id="correctAnswer" name="correctAnswer" defaultValue={String(correctValue)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="explanation">Explanation</Label>
        <textarea
          id="explanation"
          name="explanation"
          defaultValue={question.explanation}
          rows={3}
          required
          className="rounded-[var(--radius-control)] border-2 border-border bg-card p-3 text-base"
        />
      </div>
      <FieldError>{state.error}</FieldError>
      {state.success && <p className="font-bold text-success-600">Saved!</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save Question"}
      </Button>
    </form>
  );
}
