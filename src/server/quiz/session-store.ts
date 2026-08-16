import "server-only";
import { and, eq, inArray, isNull, sql, count as countFn } from "drizzle-orm";
import { db } from "@/server/db/client";
import { questions, quizSessions, sessionQuestions, attempts, topics, contestRounds } from "@/server/db/schema";
import {
  prepareSessionQuestions,
  computeDeadline,
  isPastDeadline,
  scoreAnswer,
  scoreSession,
  type EligibleQuestion,
} from "./engine";
import { QUESTIONS_PER_QUIZ } from "@/lib/constants";
import type { GradeBand, QuizMode } from "@/lib/constants";

/**
 * DB-backed quiz session lifecycle, used by the api/quiz/* route handlers.
 * All timing (`servedAt`/`deadlineAt`) is stamped here, server-side — never
 * trust a client-supplied timestamp. See server/quiz/engine.ts for the pure
 * logic this composes.
 */

export class QuizSessionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "QuizSessionError";
  }
}

async function loadEligibleQuestionsByTopics(topicIds: string[]): Promise<EligibleQuestion[]> {
  return db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      options: questions.options,
      correctOptionIndex: questions.correctOptionIndex,
      explanation: questions.explanation,
    })
    .from(questions)
    .where(and(inArray(questions.topicId, topicIds), eq(questions.status, "active")));
}

/**
 * Contest pool: every active question across the topics in a subject+grade.
 * `restrictTopicIds` narrows this to an admin-configured subset when the
 * round has one set; an empty array means unrestricted — pool across every
 * topic id resolved for that subject+grade (the original, default behavior).
 */
async function loadEligibleQuestionsBySubjectAndGrade(
  subjectId: string,
  gradeBand: GradeBand,
  restrictTopicIds: string[]
): Promise<EligibleQuestion[]> {
  const gradeTopics = await db
    .select({ id: topics.id })
    .from(topics)
    .where(
      restrictTopicIds.length > 0
        ? and(
            eq(topics.subjectId, subjectId),
            eq(topics.gradeBand, gradeBand),
            inArray(topics.id, restrictTopicIds)
          )
        : and(eq(topics.subjectId, subjectId), eq(topics.gradeBand, gradeBand))
    );
  const topicIds = gradeTopics.map((t) => t.id);
  if (topicIds.length === 0) return [];

  return db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      options: questions.options,
      correctOptionIndex: questions.correctOptionIndex,
      explanation: questions.explanation,
    })
    .from(questions)
    .where(and(inArray(questions.topicId, topicIds), eq(questions.status, "active")));
}

/** Loads a session and verifies it belongs to `userId` — call before letting a request act on a sessionId. */
export async function getOwnedSession(sessionId: string, userId: string) {
  const [session] = await db.select().from(quizSessions).where(eq(quizSessions.id, sessionId));
  if (!session || session.userId !== userId) return null;
  return session;
}

export type StartSessionInput =
  | {
      userId: string;
      mode: "practice";
      topicIds: string[];
      questionCount: number;
      gradeBand: GradeBand;
    }
  | {
      userId: string;
      mode: "contest";
      subjectId: string;
      gradeBand: GradeBand;
      roundId: string;
    };

export class ContestAttemptsExhaustedError extends QuizSessionError {
  constructor() {
    super("You've used all your attempts for this contest round.", "attempts_exhausted");
  }
}

export async function startSession(input: StartSessionInput) {
  // For contest mode, the round's own topic restriction ([] = unrestricted)
  // resolves the pool — never client-supplied, matches how eligibility is
  // already fully server-derived for contests elsewhere in this file.
  let sessionTopicIds: string[];
  let pool: EligibleQuestion[];
  if (input.mode === "practice") {
    sessionTopicIds = input.topicIds;
    pool = await loadEligibleQuestionsByTopics(input.topicIds);
  } else {
    const [round] = await db.select().from(contestRounds).where(eq(contestRounds.id, input.roundId));
    if (!round) throw new QuizSessionError("Contest round not found.", "not_found");
    sessionTopicIds = (round.topicIds as string[] | null) ?? [];
    pool = await loadEligibleQuestionsBySubjectAndGrade(input.subjectId, input.gradeBand, sessionTopicIds);
  }
  const prepared = prepareSessionQuestions(
    pool,
    input.mode === "practice" ? input.questionCount : QUESTIONS_PER_QUIZ
  ); // throws InsufficientQuestionPoolError

  const subjectId =
    input.mode === "practice"
      ? (await db.select({ subjectId: topics.subjectId }).from(topics).where(eq(topics.id, input.topicIds[0])))[0]
          ?.subjectId
      : input.subjectId;
  if (!subjectId) throw new QuizSessionError("Could not resolve subject for this session.", "not_found");

  const now = new Date();
  const deadline = computeDeadline(now);

  // Session-row + all-10-questions insert happen atomically in one
  // transaction. For contest mode, an advisory lock serializes concurrent
  // start requests from the SAME user+round and the attempt-limit is
  // re-verified inside the lock — closes the check-then-insert race where
  // two near-simultaneous requests could both pass the pre-check and each
  // insert a session, exceeding maxAttempts. The lock is scoped to this one
  // user+round pair, so it does not serialize different students starting
  // the same round concurrently — that stays fully parallel.
  const session = await db.transaction(async (tx) => {
    if (input.mode === "contest") {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${input.userId} || ':' || ${input.roundId}, 0))`
      );

      const [round] = await tx.select().from(contestRounds).where(eq(contestRounds.id, input.roundId));
      if (!round) throw new QuizSessionError("Contest round not found.", "not_found");

      const [{ startedCount }] = await tx
        .select({ startedCount: countFn() })
        .from(quizSessions)
        .where(and(eq(quizSessions.userId, input.userId), eq(quizSessions.roundId, input.roundId)));

      if (startedCount >= round.maxAttempts) {
        throw new ContestAttemptsExhaustedError();
      }
    }

    const [createdSession] = await tx
      .insert(quizSessions)
      .values({
        userId: input.userId,
        mode: input.mode,
        roundId: input.mode === "contest" ? input.roundId : undefined,
        subjectId,
        topicIds: sessionTopicIds,
        questionCount: prepared.length,
        gradeBand: input.gradeBand,
        status: "in_progress",
      })
      .returning();

    await tx.insert(sessionQuestions).values(
      prepared.map((p) => ({
        sessionId: createdSession.id,
        questionId: p.questionId,
        orderIndex: p.orderIndex,
        shuffledOptions: p.shuffledOptions,
        correctOptionIndexShuffled: p.correctOptionIndexShuffled,
        // only question 0 is "served" immediately; the rest are stamped by /next
        servedAt: p.orderIndex === 0 ? now : null,
        deadlineAt: p.orderIndex === 0 ? deadline : null,
      }))
    );

    return createdSession;
  });

  const first = pool.find((q) => q.id === prepared[0].questionId)!;
  return {
    sessionId: session.id,
    question: {
      orderIndex: 0,
      questionText: first.questionText,
      shuffledOptions: prepared[0].shuffledOptions,
      deadlineAt: deadline.toISOString(),
      totalQuestions: prepared.length,
    },
  };
}

export type AnswerInput = {
  sessionId: string;
  orderIndex: number;
  selectedOptionIndex: number | null;
};

export async function answerQuestion(input: AnswerInput) {
  const [sq] = await db
    .select()
    .from(sessionQuestions)
    .where(
      and(
        eq(sessionQuestions.sessionId, input.sessionId),
        eq(sessionQuestions.orderIndex, input.orderIndex)
      )
    );

  if (!sq) throw new QuizSessionError("Question not found for this session.", "not_found");
  if (!sq.servedAt || !sq.deadlineAt) {
    throw new QuizSessionError("This question has not been served yet.", "not_served");
  }
  if (sq.answeredAt) {
    // idempotent: return the already-recorded result rather than erroring,
    // in case of a client retry/double-submit
    return questionResultFrom(sq);
  }

  const now = new Date();
  const late = isPastDeadline(sq.deadlineAt, now);

  let update: Partial<typeof sessionQuestions.$inferInsert>;
  if (late || input.selectedOptionIndex === null) {
    update = {
      answeredAt: now,
      selectedOptionIndex: null,
      isCorrect: null,
      timedOut: true,
      pointsAwarded: 0,
    };
  } else {
    const { isCorrect, pointsAwarded } = scoreAnswer(
      input.selectedOptionIndex,
      sq.correctOptionIndexShuffled
    );
    update = {
      answeredAt: now,
      selectedOptionIndex: input.selectedOptionIndex,
      isCorrect,
      timedOut: false,
      pointsAwarded,
    };
  }

  const [updated] = await db
    .update(sessionQuestions)
    .set(update)
    .where(eq(sessionQuestions.id, sq.id))
    .returning();

  return questionResultFrom(updated);
}

async function questionResultFrom(sq: typeof sessionQuestions.$inferSelect) {
  const [question] = await db
    .select({ explanation: questions.explanation })
    .from(questions)
    .where(eq(questions.id, sq.questionId));

  return {
    isCorrect: sq.isCorrect,
    timedOut: sq.timedOut,
    pointsAwarded: sq.pointsAwarded,
    correctOptionIndex: sq.correctOptionIndexShuffled,
    explanation: question?.explanation ?? "",
  };
}

export async function nextQuestion(sessionId: string, currentOrderIndex: number) {
  const nextOrderIndex = currentOrderIndex + 1;

  // No hardcoded quiz-length check: a session's sessionQuestions row count
  // already equals its real question count (set at startSession time), so
  // "no row at nextOrderIndex" IS the done signal, for any session length.
  const [sq] = await db
    .select()
    .from(sessionQuestions)
    .where(
      and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.orderIndex, nextOrderIndex))
    );
  if (!sq) return { done: true as const };

  const now = new Date();
  const deadline = computeDeadline(now);
  const [updated] = await db
    .update(sessionQuestions)
    .set({ servedAt: now, deadlineAt: deadline })
    .where(eq(sessionQuestions.id, sq.id))
    .returning();

  const [question] = await db
    .select({ questionText: questions.questionText })
    .from(questions)
    .where(eq(questions.id, updated.questionId));

  const [session] = await db
    .select({ questionCount: quizSessions.questionCount })
    .from(quizSessions)
    .where(eq(quizSessions.id, sessionId));

  return {
    done: false as const,
    question: {
      orderIndex: updated.orderIndex,
      questionText: question?.questionText ?? "",
      shuffledOptions: updated.shuffledOptions,
      deadlineAt: deadline.toISOString(),
      totalQuestions: session?.questionCount ?? QUESTIONS_PER_QUIZ,
    },
  };
}

export type QuestionReview = {
  orderIndex: number;
  questionText: string;
  options: (string | number)[];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean | null;
  timedOut: boolean;
  explanation: string;
  /** answeredAt - servedAt, in ms — null if either timestamp is somehow missing. */
  timeTakenMs: number | null;
};

/** Full per-question review (question text, options shown, what was picked, why the answer is correct) for the results screen. */
async function buildQuestionReviews(sessionId: string): Promise<QuestionReview[]> {
  const rows = await db
    .select({
      orderIndex: sessionQuestions.orderIndex,
      shuffledOptions: sessionQuestions.shuffledOptions,
      correctOptionIndexShuffled: sessionQuestions.correctOptionIndexShuffled,
      selectedOptionIndex: sessionQuestions.selectedOptionIndex,
      isCorrect: sessionQuestions.isCorrect,
      timedOut: sessionQuestions.timedOut,
      servedAt: sessionQuestions.servedAt,
      answeredAt: sessionQuestions.answeredAt,
      questionText: questions.questionText,
      explanation: questions.explanation,
    })
    .from(sessionQuestions)
    .innerJoin(questions, eq(sessionQuestions.questionId, questions.id))
    .where(eq(sessionQuestions.sessionId, sessionId))
    .orderBy(sessionQuestions.orderIndex);

  return rows.map((r) => ({
    orderIndex: r.orderIndex,
    questionText: r.questionText,
    options: r.shuffledOptions,
    selectedOptionIndex: r.selectedOptionIndex,
    correctOptionIndex: r.correctOptionIndexShuffled,
    isCorrect: r.isCorrect,
    timedOut: r.timedOut,
    explanation: r.explanation,
    timeTakenMs: r.servedAt && r.answeredAt ? r.answeredAt.getTime() - r.servedAt.getTime() : null,
  }));
}

export async function finishSession(sessionId: string) {
  const [session] = await db.select().from(quizSessions).where(eq(quizSessions.id, sessionId));
  if (!session) throw new QuizSessionError("Session not found.", "not_found");
  if (session.status === "completed") {
    // idempotent re-fetch
    const [existing] = await db.select().from(attempts).where(eq(attempts.sessionId, sessionId));
    if (existing) {
      const reviews = await buildQuestionReviews(sessionId);
      return {
        score: existing.score,
        correctCount: existing.correctCount,
        percentage: Number(existing.percentage),
        totalQuestions: session.questionCount,
        totalTimeMs: existing.totalTimeMs,
        breakdown: reviews.map((r) => r.isCorrect === true),
        reviews,
      };
    }
  }

  const rows = await db
    .select()
    .from(sessionQuestions)
    .where(eq(sessionQuestions.sessionId, sessionId));

  const unanswered = rows.filter((r) => !r.answeredAt);
  if (unanswered.length > 0) {
    throw new QuizSessionError(
      `${unanswered.length} question(s) are still unanswered.`,
      "incomplete"
    );
  }

  const results = rows
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((r) => ({ isCorrect: r.isCorrect, timedOut: r.timedOut, pointsAwarded: r.pointsAwarded }));
  const { score, correctCount, percentage } = scoreSession(results);

  const now = new Date();
  const totalTimeMs = now.getTime() - session.startedAt.getTime();
  await db
    .update(quizSessions)
    .set({ status: "completed", score, completedAt: now })
    .where(eq(quizSessions.id, sessionId));

  const [{ value: priorCount }] = await db
    .select({ value: countFn() })
    .from(attempts)
    .where(
      session.mode === "contest"
        ? and(
            eq(attempts.userId, session.userId),
            eq(attempts.mode, session.mode),
            eq(attempts.roundId, session.roundId!)
          )
        : and(eq(attempts.userId, session.userId), eq(attempts.mode, session.mode))
    );

  await db.insert(attempts).values({
    sessionId: session.id,
    userId: session.userId,
    mode: session.mode,
    roundId: session.roundId,
    topicIds: session.topicIds,
    gradeBand: session.gradeBand,
    score,
    correctCount,
    percentage: percentage.toFixed(2),
    attemptNumber: priorCount + 1,
    totalQuestions: session.questionCount,
    totalTimeMs,
  });

  return {
    score,
    correctCount,
    percentage,
    totalQuestions: session.questionCount,
    totalTimeMs,
    breakdown: results.map((r) => r.isCorrect === true),
    reviews: await buildQuestionReviews(sessionId),
  };
}

export async function countAttempts(userId: string, mode: QuizMode, roundId?: string) {
  const [{ value }] = await db
    .select({ value: countFn() })
    .from(attempts)
    .where(
      roundId
        ? and(eq(attempts.userId, userId), eq(attempts.mode, mode), eq(attempts.roundId, roundId))
        : and(eq(attempts.userId, userId), eq(attempts.mode, mode))
    );
  return value;
}

/** Finds the current in-progress (served, unanswered) question for a session — used to resume on page load/refresh. */
export async function getCurrentQuestionOrderIndex(sessionId: string) {
  const rows = await db
    .select({ orderIndex: sessionQuestions.orderIndex })
    .from(sessionQuestions)
    .where(and(eq(sessionQuestions.sessionId, sessionId), isNull(sessionQuestions.answeredAt)))
    .orderBy(sessionQuestions.orderIndex)
    .limit(1);
  return rows[0]?.orderIndex ?? null;
}

/** Re-derives the same question payload shape startSession/nextQuestion return, for page loads. */
export async function getQuestionPayload(sessionId: string, orderIndex: number) {
  const [sq] = await db
    .select()
    .from(sessionQuestions)
    .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.orderIndex, orderIndex)));
  if (!sq || !sq.deadlineAt) return null;

  const [question] = await db
    .select({ questionText: questions.questionText })
    .from(questions)
    .where(eq(questions.id, sq.questionId));

  const [session] = await db
    .select({ questionCount: quizSessions.questionCount })
    .from(quizSessions)
    .where(eq(quizSessions.id, sessionId));

  return {
    orderIndex: sq.orderIndex,
    questionText: question?.questionText ?? "",
    shuffledOptions: sq.shuffledOptions,
    deadlineAt: sq.deadlineAt.toISOString(),
    totalQuestions: session?.questionCount ?? QUESTIONS_PER_QUIZ,
  };
}
