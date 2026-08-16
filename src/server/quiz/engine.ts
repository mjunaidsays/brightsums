import {
  POINTS_PER_QUESTION,
  QUESTIONS_PER_QUIZ,
  QUESTION_TIME_LIMIT_MS,
  TIMEOUT_BUFFER_MS,
} from "@/lib/constants";

/**
 * Pure, DB-free quiz-engine logic — sampling, shuffling, scoring, and timing
 * checks. Deliberately separated from server/quiz/session-store.ts (the DB
 * reads/writes) so this, the highest-risk logic in the app, is unit-testable
 * without a database. Never import drizzle/db here.
 */

export type EligibleQuestion = {
  id: string;
  questionText: string;
  options: (string | number)[];
  correctOptionIndex: number;
  explanation: string;
};

export class InsufficientQuestionPoolError extends Error {
  constructor(available: number, required: number) {
    super(
      `Not enough questions in this topic yet: ${available} available, ${required} required.`
    );
    this.name = "InsufficientQuestionPoolError";
  }
}

/** Fisher-Yates shuffle — does not mutate the input array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Randomly samples exactly QUESTIONS_PER_QUIZ questions from the eligible
 * pool (already filtered by topic/grade/round + status='active' at the SQL
 * level). Throws if the pool is too small — never silently repeats
 * questions to pad out a session.
 */
export function sampleQuestions(
  pool: readonly EligibleQuestion[],
  count: number = QUESTIONS_PER_QUIZ
): EligibleQuestion[] {
  if (pool.length < count) {
    throw new InsufficientQuestionPoolError(pool.length, count);
  }
  return shuffle(pool).slice(0, count);
}

export type ShuffledOptions = {
  shuffledOptions: (string | number)[];
  correctOptionIndexShuffled: number;
};

/**
 * Shuffles a single question's options for one attempt, tracking where the
 * correct answer moved to. The source question's `options` array is never
 * mutated (shuffle() returns a copy).
 */
export function shuffleOptions(question: EligibleQuestion): ShuffledOptions {
  const correctValue = question.options[question.correctOptionIndex];
  const shuffledOptions = shuffle(question.options);
  const correctOptionIndexShuffled = shuffledOptions.indexOf(correctValue);
  return { shuffledOptions, correctOptionIndexShuffled };
}

/** Prepares all `count` questions for a session in one pass. */
export function prepareSessionQuestions(
  pool: readonly EligibleQuestion[],
  count: number = QUESTIONS_PER_QUIZ
) {
  return sampleQuestions(pool, count).map((question, orderIndex) => {
    const { shuffledOptions, correctOptionIndexShuffled } = shuffleOptions(question);
    return {
      orderIndex,
      questionId: question.id,
      shuffledOptions,
      correctOptionIndexShuffled,
    };
  });
}

export function computeDeadline(servedAt: Date, timeLimitMs = QUESTION_TIME_LIMIT_MS): Date {
  return new Date(servedAt.getTime() + timeLimitMs);
}

/**
 * The sole timing-authority check: is `now` past the deadline (plus a small
 * network-latency buffer)? Used by api/quiz/answer to decide whether a
 * submission counts as a real answer or must be recorded as a timeout,
 * regardless of what the client claims.
 */
export function isPastDeadline(
  deadlineAt: Date,
  now: Date = new Date(),
  bufferMs = TIMEOUT_BUFFER_MS
): boolean {
  return now.getTime() > deadlineAt.getTime() + bufferMs;
}

export type ScoredAnswer = {
  isCorrect: boolean;
  pointsAwarded: number;
};

/** Scores a single answered (non-timeout) question. */
export function scoreAnswer(
  selectedOptionIndex: number,
  correctOptionIndexShuffled: number
): ScoredAnswer {
  const isCorrect = selectedOptionIndex === correctOptionIndexShuffled;
  return { isCorrect, pointsAwarded: isCorrect ? POINTS_PER_QUESTION : 0 };
}

export type SessionQuestionResult = {
  isCorrect: boolean | null;
  timedOut: boolean;
  pointsAwarded: number;
};

export type SessionScore = {
  score: number;
  correctCount: number;
  percentage: number;
};

/** Aggregates a session's per-question results into a final score. */
export function scoreSession(results: readonly SessionQuestionResult[]): SessionScore {
  const correctCount = results.filter((r) => r.isCorrect === true).length;
  const score = results.reduce((sum, r) => sum + r.pointsAwarded, 0);
  const percentage =
    results.length === 0 ? 0 : Math.round((score / (results.length * POINTS_PER_QUESTION)) * 10000) / 100;
  return { score, correctCount, percentage };
}
