"use client";

import { useActionState } from "react";
import { startPracticeSession, type StartPracticeState } from "@/actions/quiz.actions";
import { Button } from "@/components/ui/button";
import { Label, FieldError } from "@/components/ui/input";
import { TopicDropdown } from "./topic-dropdown";
import { type TopicOption } from "./topic-multi-select";
import { QUESTIONS_PER_QUIZ } from "@/lib/constants";

const initialState: StartPracticeState = {};

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30];

export function PracticeStartForm({ topics }: { topics: TopicOption[] }) {
  const [state, formAction, pending] = useActionState(startPracticeSession, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label>Topics</Label>
        <TopicDropdown topics={topics} selectAllLabel="Select All Topics" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="questionCount">Number of Questions</Label>
        <select
          id="questionCount"
          name="questionCount"
          defaultValue={QUESTIONS_PER_QUIZ}
          className="h-12 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
        >
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count} Questions
            </option>
          ))}
        </select>
      </div>

      <FieldError>{state?.error}</FieldError>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Starting..." : "Start Practice 🚀"}
      </Button>
    </form>
  );
}
