"use client";

import { useActionState } from "react";
import { createTopic, type CreateTopicState } from "@/actions/admin-topics.actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { GRADE_BANDS, GRADE_BAND_LABELS } from "@/lib/constants";

const initialState: CreateTopicState = {};

export function CreateTopicForm() {
  const [state, formAction, pending] = useActionState(createTopic, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">New Topic Name</Label>
        <Input id="name" name="name" placeholder="e.g. Fractions & Decimals" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gradeBand">Grade</Label>
        <select
          id="gradeBand"
          name="gradeBand"
          className="h-12 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
        >
          {GRADE_BANDS.map((band) => (
            <option key={band} value={band}>
              {GRADE_BAND_LABELS[band]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Topic"}
      </Button>
      <FieldError>{state.error}</FieldError>
      {state.success && <p className="font-bold text-success-600">Added!</p>}
    </form>
  );
}
