"use client";

import { useActionState } from "react";
import { startContestSession, type StartContestState } from "@/actions/quiz.actions";
import { Button } from "@/components/ui/button";

export function StartContestButton({
  roundId,
  subjectId,
  disabled,
}: {
  roundId: string;
  subjectId: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<StartContestState, FormData>(
    () => startContestSession(roundId, subjectId),
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button type="submit" disabled={disabled || pending}>
        {pending ? "Starting..." : "Play Contest 🏆"}
      </Button>
      {state?.error && <p className="text-sm font-bold text-destructive">{state.error}</p>}
    </form>
  );
}
