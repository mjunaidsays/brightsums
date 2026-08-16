import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { GRADE_BANDS, QUIZ_MODES } from "@/lib/constants";
import { quizSessions } from "./quiz-sessions";
import { users } from "./users";
import { contestRounds } from "./contests";

/**
 * Denormalized summary row, one per completed quizSession, written by
 * api/quiz/finish. Kept as a real table (not a view) so the leaderboard's
 * RANK() OVER (PARTITION BY gradeBand ORDER BY score DESC) query and the
 * dashboard's attempt-history tables stay index-friendly and fast — recomputing
 * from session_questions on every page load would be needlessly expensive.
 */
export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .unique()
      .references(() => quizSessions.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    mode: text("mode", { enum: QUIZ_MODES }).notNull(),
    roundId: uuid("round_id").references(() => contestRounds.id),
    // snapshot of the session's topicIds — see quiz-sessions.ts
    topicIds: jsonb("topic_ids").$type<string[]>().notNull().default([]),
    gradeBand: text("grade_band", { enum: GRADE_BANDS }).notNull(),
    score: integer("score").notNull(),
    correctCount: integer("correct_count").notNull(),
    percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    // snapshot of quizSessions.questionCount — score alone is meaningless
    // without this once sessions can have a variable question count (a
    // score of 20 means something different out of 5 questions vs 20)
    totalQuestions: integer("total_questions").notNull(),
    // wall-clock duration of the whole session (quizSessions.completedAt -
    // startedAt) — used as a leaderboard tie-breaker when scores are equal
    totalTimeMs: integer("total_time_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("attempts_user_mode_created_idx").on(table.userId, table.mode, table.createdAt),
    index("attempts_round_grade_score_idx").on(
      table.roundId,
      table.gradeBand,
      table.score,
      table.totalTimeMs
    ),
  ]
);
