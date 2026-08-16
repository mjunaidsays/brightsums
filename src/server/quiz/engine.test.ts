import { describe, it, expect } from "vitest";
import {
  sampleQuestions,
  shuffleOptions,
  prepareSessionQuestions,
  computeDeadline,
  isPastDeadline,
  scoreAnswer,
  scoreSession,
  InsufficientQuestionPoolError,
  type EligibleQuestion,
} from "./engine";
import { QUESTIONS_PER_QUIZ, POINTS_PER_QUESTION, QUESTION_TIME_LIMIT_MS } from "@/lib/constants";

function makePool(size: number): EligibleQuestion[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `q${i}`,
    questionText: `Question ${i}?`,
    options: [i, i + 1, i + 2, i + 3],
    correctOptionIndex: 0,
    explanation: `Because ${i}.`,
  }));
}

describe("sampleQuestions", () => {
  it("returns exactly QUESTIONS_PER_QUIZ questions with no duplicates", () => {
    const pool = makePool(50);
    const sample = sampleQuestions(pool);
    expect(sample).toHaveLength(QUESTIONS_PER_QUIZ);
    expect(new Set(sample.map((q) => q.id)).size).toBe(QUESTIONS_PER_QUIZ);
  });

  it("throws InsufficientQuestionPoolError when the pool is smaller than required", () => {
    const pool = makePool(5);
    expect(() => sampleQuestions(pool)).toThrow(InsufficientQuestionPoolError);
  });

  it("supports a variable, student-chosen count instead of the default", () => {
    const pool = makePool(50);
    const sample = sampleQuestions(pool, 5);
    expect(sample).toHaveLength(5);
    expect(new Set(sample.map((q) => q.id)).size).toBe(5);
  });

  it("does not always return the pool in original order (shuffled)", () => {
    const pool = makePool(50);
    const orders = new Set<string>();
    for (let i = 0; i < 20; i++) {
      orders.add(sampleQuestions(pool).map((q) => q.id).join(","));
    }
    // astronomically unlikely to collide 20 times in a row if truly shuffled
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe("shuffleOptions", () => {
  it("preserves the correct answer's identity after shuffling", () => {
    const question: EligibleQuestion = {
      id: "q1",
      questionText: "2 x 3?",
      options: [5, 6, 7, 8],
      correctOptionIndex: 1, // value 6
      explanation: "2 groups of 3 is 6.",
    };
    const { shuffledOptions, correctOptionIndexShuffled } = shuffleOptions(question);
    expect(shuffledOptions).toHaveLength(4);
    expect(shuffledOptions[correctOptionIndexShuffled]).toBe(6);
    expect([...shuffledOptions].sort()).toEqual([5, 6, 7, 8]);
  });

  it("does not mutate the source question's options array", () => {
    const original = [5, 6, 7, 8];
    const question: EligibleQuestion = {
      id: "q1",
      questionText: "2 x 3?",
      options: original,
      correctOptionIndex: 1,
      explanation: "x",
    };
    shuffleOptions(question);
    expect(question.options).toBe(original);
    expect(original).toEqual([5, 6, 7, 8]);
  });
});

describe("prepareSessionQuestions", () => {
  it("produces QUESTIONS_PER_QUIZ entries with sequential orderIndex 0..9 by default", () => {
    const pool = makePool(30);
    const prepared = prepareSessionQuestions(pool);
    expect(prepared).toHaveLength(QUESTIONS_PER_QUIZ);
    expect(prepared.map((p) => p.orderIndex)).toEqual([...Array(QUESTIONS_PER_QUIZ).keys()]);
  });

  it("produces exactly `count` entries with sequential orderIndex when given a variable count", () => {
    const pool = makePool(30);
    const prepared = prepareSessionQuestions(pool, 3);
    expect(prepared).toHaveLength(3);
    expect(prepared.map((p) => p.orderIndex)).toEqual([0, 1, 2]);
  });
});

describe("timing authority (computeDeadline / isPastDeadline)", () => {
  it("computes a deadline exactly QUESTION_TIME_LIMIT_MS after servedAt", () => {
    const servedAt = new Date("2026-01-01T00:00:00.000Z");
    const deadline = computeDeadline(servedAt);
    expect(deadline.getTime() - servedAt.getTime()).toBe(QUESTION_TIME_LIMIT_MS);
  });

  it("is not past deadline for a submission within the window", () => {
    const deadline = new Date("2026-01-01T00:01:00.000Z");
    const now = new Date("2026-01-01T00:00:59.000Z");
    expect(isPastDeadline(deadline, now)).toBe(false);
  });

  it("is not past deadline for a submission inside the network buffer", () => {
    const deadline = new Date("2026-01-01T00:01:00.000Z");
    const now = new Date("2026-01-01T00:01:01.000Z"); // 1s late, buffer is 1.5s
    expect(isPastDeadline(deadline, now)).toBe(false);
  });

  it("IS past deadline once the buffer is exceeded, regardless of client claims", () => {
    const deadline = new Date("2026-01-01T00:01:00.000Z");
    const now = new Date("2026-01-01T00:01:05.000Z"); // 5s late
    expect(isPastDeadline(deadline, now)).toBe(true);
  });
});

describe("scoreAnswer", () => {
  it("awards POINTS_PER_QUESTION for a correct answer", () => {
    expect(scoreAnswer(2, 2)).toEqual({ isCorrect: true, pointsAwarded: POINTS_PER_QUESTION });
  });

  it("awards 0 points for an incorrect answer", () => {
    expect(scoreAnswer(1, 2)).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });
});

describe("scoreSession", () => {
  it("sums points and correct count across all 10 questions", () => {
    const results = [
      ...Array.from({ length: 7 }, () => ({ isCorrect: true, timedOut: false, pointsAwarded: 10 })),
      ...Array.from({ length: 2 }, () => ({ isCorrect: false, timedOut: false, pointsAwarded: 0 })),
      { isCorrect: null, timedOut: true, pointsAwarded: 0 },
    ];
    const summary = scoreSession(results);
    expect(summary.correctCount).toBe(7);
    expect(summary.score).toBe(70);
    expect(summary.percentage).toBe(70);
  });

  it("scores a perfect run as 100/100", () => {
    const results = Array.from({ length: QUESTIONS_PER_QUIZ }, () => ({
      isCorrect: true,
      timedOut: false,
      pointsAwarded: POINTS_PER_QUESTION,
    }));
    expect(scoreSession(results)).toEqual({ score: 100, correctCount: 10, percentage: 100 });
  });

  it("derives the percentage denominator from the actual session length, not a fixed 10", () => {
    // 5-question practice session, 4 correct — must NOT be scored against 10.
    const results = [
      ...Array.from({ length: 4 }, () => ({ isCorrect: true, timedOut: false, pointsAwarded: 10 })),
      { isCorrect: false, timedOut: false, pointsAwarded: 0 },
    ];
    const summary = scoreSession(results);
    expect(summary.correctCount).toBe(4);
    expect(summary.score).toBe(40);
    expect(summary.percentage).toBe(80);
  });
});
