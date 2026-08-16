"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { schools, users } from "@/server/db/schema";

export type MergeSchoolsState = { error?: string; success?: boolean };

/**
 * Merges `duplicateId` into `canonicalId`: reassigns every student's
 * schoolId to the canonical row (so every existing query — leaderboard,
 * admin search, profile — is immediately and permanently correct with no
 * special-case "resolve merged schools" logic needed elsewhere), then marks
 * the duplicate as merged (kept, not deleted, for audit history).
 */
export async function mergeSchools(
  _prevState: MergeSchoolsState,
  formData: FormData
): Promise<MergeSchoolsState> {
  await requireAdmin();

  const duplicateId = String(formData.get("duplicateId") ?? "");
  const canonicalId = String(formData.get("canonicalId") ?? "");

  if (!duplicateId || !canonicalId) return { error: "Select both a duplicate and a canonical school." };
  if (duplicateId === canonicalId) return { error: "Can't merge a school into itself." };

  const [duplicate] = await db.select().from(schools).where(eq(schools.id, duplicateId));
  const [canonical] = await db.select().from(schools).where(eq(schools.id, canonicalId));
  if (!duplicate || !canonical) return { error: "One of the selected schools was not found." };
  if (canonical.status === "merged") {
    return { error: "The canonical school is itself already merged into another — pick its canonical row instead." };
  }

  await db.transaction(async (tx) => {
    await tx.update(users).set({ schoolId: canonicalId }).where(eq(users.schoolId, duplicateId));
    await tx
      .update(schools)
      .set({ status: "merged", mergedIntoId: canonicalId })
      .where(eq(schools.id, duplicateId));
  });

  revalidatePath("/admin/schools");
  return { success: true };
}

/**
 * Hard-deletes a school — only safe when no student is assigned to it and
 * no other school is merged into it (mergedIntoId isn't a real FK, so a
 * dangling reference wouldn't error at the DB level, just silently corrupt
 * data — checked explicitly here instead). The admin/schools list only ever
 * renders this action for schools with zero students, but both checks are
 * repeated here as the real enforcement point.
 */
export async function deleteSchool(schoolId: string) {
  await requireAdmin();

  const [{ count: studentCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.schoolId, schoolId));
  const [{ count: mergedFromCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schools)
    .where(eq(schools.mergedIntoId, schoolId));

  if (studentCount > 0 || mergedFromCount > 0) return;

  await db.delete(schools).where(eq(schools.id, schoolId));
  revalidatePath("/admin/schools");
}
