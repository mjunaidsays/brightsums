"use server";

import { redirect } from "next/navigation";
import {
  startSession,
  ContestAttemptsExhaustedError,
} from "@/server/quiz/session-store";
import { InsufficientQuestionPoolError } from "@/server/quiz/engine";
import { requireStudent } from "@/server/auth/session";
import { assertContestEligibility, ContestEligibilityError } from "@/server/db/queries/contests.queries";
import { QUESTIONS_PER_QUIZ } from "@/lib/constants";

export type StartPracticeState = { error?: string } | undefined;

/**
 * Phase 2+: identity is ALWAYS derived from the server-side session inside
 * this action, never trusted from a client-supplied parameter — only the
 * non-identity fields (topicIds/questionCount) come from the form. Creates
 * the session server-side and redirects — the client-side quiz-screen only
 * ever mounts once a session already exists, avoiding a client-triggered
 * double-POST race on load.
 */
export async function startPracticeSession(
  _prevState: StartPracticeState,
  formData: FormData
): Promise<StartPracticeState> {
  const user = await requireStudent();

  const topicIds = formData.getAll("topicIds").map(String);
  if (topicIds.length === 0) {
    return { error: "Select at least one topic." };
  }

  const rawCount = Number(formData.get("questionCount"));
  const questionCount = Number.isInteger(rawCount) && rawCount > 0 ? rawCount : QUESTIONS_PER_QUIZ;

  try {
    const { sessionId } = await startSession({
      userId: user.id,
      mode: "practice",
      topicIds,
      questionCount,
      gradeBand: user.gradeBand,
    });
    redirect(`/practice/${sessionId}`);
  } catch (err) {
    if (err instanceof InsufficientQuestionPoolError) return { error: err.message };
    throw err;
  }
}

export type StartContestState = { error?: string } | undefined;

/**
 * Same identity-from-session pattern as startPracticeSession, plus a hard
 * server-side eligibility gate (round window/status/grade/attempt-limit) —
 * this is the actual enforcement point; the UI hiding an ineligible round is
 * just a courtesy, not the security boundary.
 */
export async function startContestSession(
  roundId: string,
  subjectId: string
): Promise<StartContestState> {
  const user = await requireStudent();

  // Fast, user-friendly pre-check (window/status/grade/attempt count) —
  // startSession's transaction below is the actual race-safe enforcement
  // point for the attempt limit specifically, this just avoids a wasted
  // question-sampling pass for the common, non-racy rejection cases.
  try {
    await assertContestEligibility(roundId, user.id, user.gradeBand);
  } catch (err) {
    if (err instanceof ContestEligibilityError) return { error: err.message };
    throw err;
  }

  try {
    const { sessionId } = await startSession({
      userId: user.id,
      mode: "contest",
      subjectId,
      gradeBand: user.gradeBand,
      roundId,
    });
    redirect(`/contest/${roundId}/${sessionId}`);
  } catch (err) {
    if (err instanceof ContestAttemptsExhaustedError) return { error: err.message };
    throw err;
  }
}
