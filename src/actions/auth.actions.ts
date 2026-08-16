"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { completeProfileSchema } from "@/lib/validation/profile.schema";
import { resolveOrCreateSchool } from "@/server/db/queries/schools.queries";

export type CompleteProfileState = {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
};

/**
 * Step 2 of signup. Requires an active Better Auth session (created by step
 * 1's email/password signUp) and creates BrightSums' own `users` profile row
 * linked to it — see server/auth/auth.ts's header comment on why these are
 * two separate tables.
 */
export async function completeProfile(
  _prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, session.user.id));
  if (existing) redirect("/dashboard");

  const parsed = completeProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const school = await resolveOrCreateSchool({
      schoolId: parsed.data.schoolId,
      newSchoolName: parsed.data.newSchoolName,
      newSchoolCity: parsed.data.newSchoolCity,
    });

    await db.insert(users).values({
      betterAuthUserId: session.user.id,
      role: "student",
      fullName: parsed.data.fullName,
      age: parsed.data.age,
      parentName: parsed.data.parentName,
      parentPhone: parsed.data.parentPhone,
      gradeBand: parsed.data.gradeBand,
      schoolId: school.id,
      city: parsed.data.city || null,
      gender: parsed.data.gender || null,
      dateOfBirth: parsed.data.dateOfBirth || null,
    });
  } catch (err) {
    console.error(err);
    return { formError: "Something went wrong saving your profile. Please try again." };
  }

  redirect("/dashboard");
}
