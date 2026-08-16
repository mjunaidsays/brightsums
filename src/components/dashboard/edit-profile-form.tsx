"use client";

import { useActionState } from "react";
import { updateProfile, type UpdateProfileState } from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { GRADE_BANDS, GRADE_BAND_LABELS } from "@/lib/constants";
import type { StudentProfile } from "@/server/auth/session";

const initialState: UpdateProfileState = {};

export function EditProfileForm({ user }: { user: StudentProfile }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" defaultValue={user.fullName} required />
        <FieldError>{state.fieldErrors?.fullName?.[0]}</FieldError>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" type="number" defaultValue={user.age} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gradeBand">Grade</Label>
          <select
            id="gradeBand"
            name="gradeBand"
            defaultValue={user.gradeBand}
            className="h-12 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
          >
            {GRADE_BANDS.map((band) => (
              <option key={band} value={band}>
                {GRADE_BAND_LABELS[band]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parentName">Parent / Guardian Name</Label>
        <Input id="parentName" name="parentName" defaultValue={user.parentName} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parentPhone">Parent / Guardian Phone</Label>
        <Input id="parentPhone" name="parentPhone" defaultValue={user.parentPhone} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={user.city ?? ""} />
      </div>
      <FieldError>{state.formError}</FieldError>
      {state.success && <p className="font-bold text-success-600">Saved!</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
