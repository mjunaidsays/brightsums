"use client";

import { useActionState } from "react";
import { completeProfile, type CompleteProfileState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SchoolTypeahead } from "./school-typeahead";
import { GRADE_BANDS, GRADE_BAND_LABELS } from "@/lib/constants";

const initialState: CompleteProfileState = {};

export function SignupWizardStep2() {
  const [state, formAction, pending] = useActionState(completeProfile, initialState);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Tell Us About You</CardTitle>
        <CardDescription>Step 2 of 2 — this helps us rank you fairly.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Student Full Name</Label>
            <Input id="fullName" name="fullName" required />
            <FieldError>{state.fieldErrors?.fullName?.[0]}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" min={3} max={25} required />
              <FieldError>{state.fieldErrors?.age?.[0]}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gradeBand">Grade</Label>
              <select
                id="gradeBand"
                name="gradeBand"
                required
                className="h-12 rounded-[var(--radius-control)] border-2 border-border bg-card px-3 text-base"
              >
                {GRADE_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {GRADE_BAND_LABELS[band]}
                  </option>
                ))}
              </select>
              <FieldError>{state.fieldErrors?.gradeBand?.[0]}</FieldError>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="parentName">Parent / Guardian Name</Label>
            <Input id="parentName" name="parentName" required />
            <FieldError>{state.fieldErrors?.parentName?.[0]}</FieldError>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="parentPhone">Parent / Guardian Phone</Label>
            <Input id="parentPhone" name="parentPhone" type="tel" required />
            <FieldError>{state.fieldErrors?.parentPhone?.[0]}</FieldError>
          </div>

          <SchoolTypeahead error={state.fieldErrors?.schoolId?.[0]} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City (optional)</Label>
            <Input id="city" name="city" />
          </div>

          <FieldError>{state.formError}</FieldError>

          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Saving..." : "Finish Sign Up 🎉"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
