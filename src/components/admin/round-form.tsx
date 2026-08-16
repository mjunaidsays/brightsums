"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { GRADE_BANDS, GRADE_BAND_LABELS, ROUND_STATUSES } from "@/lib/constants";
import type { RoundFormState } from "@/actions/admin-contests.actions";
import type { contestRounds } from "@/server/db/schema";
import { TopicMultiSelect, type TopicOption } from "@/components/quiz/topic-multi-select";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function RoundForm({
  round,
  action,
  topics,
}: {
  round?: typeof contestRounds.$inferSelect;
  action: (prevState: RoundFormState, formData: FormData) => Promise<RoundFormState>;
  topics: TopicOption[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const selectedGrades = (round?.gradeBands as string[] | undefined) ?? [];
  const selectedTopicIds = (round?.topicIds as string[] | undefined) ?? [];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Round Name</Label>
        <Input id="name" name="name" defaultValue={round?.name} placeholder="Round 1" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Eligible Grades</Label>
        <div className="flex flex-wrap gap-2">
          {GRADE_BANDS.map((band) => (
            <label
              key={band}
              className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border-2 border-border px-3 py-1.5 text-sm font-bold has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
            >
              <input
                type="checkbox"
                name="gradeBands"
                value={band}
                defaultChecked={selectedGrades.includes(band)}
              />
              {GRADE_BAND_LABELS[band]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Restrict to Topics (optional — leave empty to pool from every topic)</Label>
        <TopicMultiSelect
          topics={topics}
          defaultSelected={selectedTopicIds}
          selectAllLabel="Restrict to All Topics"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="opensAt">Opens At</Label>
          <Input
            id="opensAt"
            name="opensAt"
            type="datetime-local"
            defaultValue={round ? toLocalInputValue(new Date(round.opensAt)) : undefined}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="closesAt">Closes At</Label>
          <Input
            id="closesAt"
            name="closesAt"
            type="datetime-local"
            defaultValue={round ? toLocalInputValue(new Date(round.closesAt)) : undefined}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxAttempts">Max Attempts</Label>
          <Input
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            min={1}
            defaultValue={round?.maxAttempts ?? 1}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="advanceCountPerGrade">Advance Per Grade (optional)</Label>
          <Input
            id="advanceCountPerGrade"
            name="advanceCountPerGrade"
            type="number"
            min={1}
            defaultValue={round?.advanceCountPerGrade ?? undefined}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={round?.status ?? "draft"}
            className="h-12 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
          >
            {ROUND_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : round ? "Save Changes" : "Create Round"}
      </Button>
    </form>
  );
}
