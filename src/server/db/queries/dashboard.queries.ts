import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { attempts } from "@/server/db/schema";

const RECENT_ATTEMPTS_LIMIT = 5;

export async function getDashboardData(userId: string) {
  // percentage (not raw score) — score's 0-100 range only meant something
  // back when every quiz was a fixed 10 questions; practice sessions can
  // now have any question count, so percentage is the only scale-invariant
  // way to compare attempts against each other or display a single "best".
  const [bestPractice] = await db
    .select({ best: sql<number | null>`max(${attempts.percentage})` })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.mode, "practice")));

  const recentPracticeAttempts = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.mode, "practice")))
    .orderBy(desc(attempts.createdAt))
    .limit(RECENT_ATTEMPTS_LIMIT);

  const recentContestAttempts = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.mode, "contest")))
    .orderBy(desc(attempts.createdAt))
    .limit(RECENT_ATTEMPTS_LIMIT);

  // chart reads oldest -> newest so the line trends left-to-right chronologically
  const chartAttempts = await db
    .select({ attemptNumber: attempts.attemptNumber, percentage: attempts.percentage })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.mode, "practice")))
    .orderBy(attempts.createdAt)
    .limit(50);

  return {
    bestPracticePercentage: bestPractice?.best != null ? Number(bestPractice.best) : null,
    recentPracticeAttempts,
    recentContestAttempts,
    chartData: chartAttempts.map((a) => ({ attempt: a.attemptNumber, percentage: Number(a.percentage) })),
  };
}
