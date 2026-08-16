"use client";

import { useActionState } from "react";
import { mergeSchools, type MergeSchoolsState } from "@/actions/admin-schools.actions";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

type School = { id: string; name: string; city: string | null; status: string };

const initialState: MergeSchoolsState = {};

export function MergeSchoolsForm({ schools }: { schools: School[] }) {
  const [state, formAction, pending] = useActionState(mergeSchools, initialState);
  const active = schools.filter((s) => s.status === "active");

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold">Duplicate (will be merged away)</label>
        <select
          name="duplicateId"
          className="h-12 min-w-48 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
        >
          <option value="">Select...</option>
          {active.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.city ? `(${s.city})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold">Canonical (kept)</label>
        <select
          name="canonicalId"
          className="h-12 min-w-48 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
        >
          <option value="">Select...</option>
          {active.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.city ? `(${s.city})` : ""}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Merging..." : "Merge Schools"}
      </Button>
      <FieldError>{state.error}</FieldError>
      {state.success && <p className="font-bold text-success-600">Merged!</p>}
    </form>
  );
}
