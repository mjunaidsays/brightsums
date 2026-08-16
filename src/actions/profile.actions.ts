"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { updateProfileSchema } from "@/lib/validation/profile.schema";

export type UpdateProfileState = {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
};

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .update(users)
      .set({
        fullName: parsed.data.fullName,
        age: parsed.data.age,
        parentName: parsed.data.parentName,
        parentPhone: parsed.data.parentPhone,
        gradeBand: parsed.data.gradeBand,
        city: parsed.data.city || null,
        gender: parsed.data.gender || null,
        dateOfBirth: parsed.data.dateOfBirth || null,
        updatedAt: new Date(),
      })
      .where(eq(users.betterAuthUserId, session.user.id));
  } catch (err) {
    console.error(err);
    return { formError: "Something went wrong saving your profile. Please try again." };
  }

  revalidatePath("/profile");
  return { success: true };
}
