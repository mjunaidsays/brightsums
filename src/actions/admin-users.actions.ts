"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/client";
import {
  users,
  attempts,
  quizSessions,
  documentVerifications,
  questions,
  contestRounds,
  user as authUser,
} from "@/server/db/schema";

/**
 * Hard-deletes a student account and every row that traces back to them —
 * quiz sessions (which cascades session_questions), attempts, and document
 * verifications — plus the linked Better Auth `user` row (which cascades its
 * own session/account rows). Restricted to role === "student" as the real
 * enforcement point (the admin/users list only ever lists students in the
 * first place, via searchStudents, but this is checked again here rather
 * than trusted from the caller) — deleting an admin account isn't offered by
 * this action at all, to avoid ever locking out a colleague by accident.
 * Authorship references (questions/contest_rounds createdByUserId) are
 * nulled out defensively, though a student should never hold either.
 */
export async function deleteUser(userId: string) {
  await requireAdmin();

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target || target.role !== "student") return;

  await db.transaction(async (tx) => {
    await tx.delete(documentVerifications).where(eq(documentVerifications.userId, userId));
    await tx.delete(attempts).where(eq(attempts.userId, userId));
    await tx.delete(quizSessions).where(eq(quizSessions.userId, userId));
    await tx.update(questions).set({ createdByUserId: null }).where(eq(questions.createdByUserId, userId));
    await tx
      .update(contestRounds)
      .set({ createdByUserId: null })
      .where(eq(contestRounds.createdByUserId, userId));
    await tx.delete(users).where(eq(users.id, userId));
    await tx.delete(authUser).where(eq(authUser.id, target.betterAuthUserId));
  });

  revalidatePath("/admin/users");
}
