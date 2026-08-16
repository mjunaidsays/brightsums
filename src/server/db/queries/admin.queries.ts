import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { questions, contestRounds, users, documentVerifications } from "@/server/db/schema";

export async function getAdminOverview() {
  const [[{ questionCount }], [{ studentCount }], [{ openRoundCount }], [{ pendingDocCount }]] =
    await Promise.all([
      db.select({ questionCount: sql<number>`count(*)::int` }).from(questions).where(eq(questions.status, "active")),
      db.select({ studentCount: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "student")),
      db
        .select({ openRoundCount: sql<number>`count(*)::int` })
        .from(contestRounds)
        .where(eq(contestRounds.status, "open")),
      db
        .select({ pendingDocCount: sql<number>`count(*)::int` })
        .from(documentVerifications)
        .where(eq(documentVerifications.status, "pending")),
    ]);

  return { questionCount, studentCount, openRoundCount, pendingDocCount };
}
