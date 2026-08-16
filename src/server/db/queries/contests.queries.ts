import "server-only";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { contestRounds, quizSessions } from "@/server/db/schema";
import type { GradeBand } from "@/lib/constants";

export async function getRound(roundId: string) {
  const [round] = await db.select().from(contestRounds).where(eq(contestRounds.id, roundId));
  return round ?? null;
}

/** Rounds currently open (status + window) and eligible for a given grade band — shown on /contest. */
export async function getOpenRoundsForGrade(gradeBand: GradeBand) {
  const now = new Date();
  const rows = await db
    .select()
    .from(contestRounds)
    .where(
      and(
        eq(contestRounds.status, "open"),
        lte(contestRounds.opensAt, now),
        gte(contestRounds.closesAt, now)
      )
    )
    .orderBy(desc(contestRounds.opensAt));

  return rows.filter((r) => (r.gradeBands as GradeBand[]).includes(gradeBand));
}

export async function getAllRoundsForGrade(gradeBand: GradeBand) {
  const rows = await db.select().from(contestRounds).orderBy(desc(contestRounds.opensAt));
  return rows.filter((r) => (r.gradeBands as GradeBand[]).includes(gradeBand));
}

export class ContestEligibilityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ContestEligibilityError";
  }
}

/**
 * Counts SESSIONS STARTED for this round, not completed attempts — an
 * attempt counts against the limit the moment it starts, whether the
 * student finishes it or not. Counting only completed attempts would let a
 * student start unlimited sessions by never finishing them (each abandoned
 * session wouldn't count), which is exactly the bypass a maxAttempts cap is
 * meant to prevent.
 */
async function countStartedAttempts(roundId: string, userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizSessions)
    .where(and(eq(quizSessions.userId, userId), eq(quizSessions.roundId, roundId)));
  return count;
}

/**
 * Enforces round eligibility: status open, within the open/close window,
 * student's grade band is eligible, and the student hasn't exceeded
 * maxAttempts for this round. Throws ContestEligibilityError with a
 * user-facing reason on any failure — never a generic 500, since these are
 * expected, common outcomes (round closed, attempts used up), not bugs.
 */
export async function assertContestEligibility(roundId: string, userId: string, gradeBand: GradeBand) {
  const round = await getRound(roundId);
  if (!round) throw new ContestEligibilityError("This contest round was not found.", "not_found");

  const now = new Date();
  if (round.status !== "open") {
    throw new ContestEligibilityError("This contest round is not currently open.", "not_open");
  }
  if (now < round.opensAt) {
    throw new ContestEligibilityError("This contest round hasn't started yet.", "not_started");
  }
  if (now > round.closesAt) {
    throw new ContestEligibilityError("This contest round has closed.", "closed");
  }
  if (!(round.gradeBands as GradeBand[]).includes(gradeBand)) {
    throw new ContestEligibilityError("This contest round isn't open to your grade.", "wrong_grade");
  }

  const count = await countStartedAttempts(roundId, userId);
  if (count >= round.maxAttempts) {
    throw new ContestEligibilityError(
      "You've used all your attempts for this contest round.",
      "attempts_exhausted"
    );
  }

  return { round, attemptsUsed: count, attemptsRemaining: round.maxAttempts - count };
}

/** Non-throwing status check for display purposes (e.g. "2 attempts remaining" on the round list). */
export async function getRoundAttemptStatus(roundId: string, userId: string) {
  const round = await getRound(roundId);
  if (!round) return null;

  const count = await countStartedAttempts(roundId, userId);
  const now = new Date();
  const withinWindow = now >= round.opensAt && now <= round.closesAt;

  return {
    round,
    attemptsUsed: count,
    attemptsRemaining: Math.max(0, round.maxAttempts - count),
    canPlay: round.status === "open" && withinWindow && count < round.maxAttempts,
  };
}
