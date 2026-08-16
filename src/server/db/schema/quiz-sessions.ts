import { pgTable, text, timestamp, uuid, integer, index, jsonb } from "drizzle-orm/pg-core";
import { GRADE_BANDS, QUIZ_MODES, QUESTIONS_PER_QUIZ } from "@/lib/constants";
import { users } from "./users";
import { contestRounds } from "./contests";
import { subjects } from "./subjects";

export const quizSessions = pgTable(
  "quiz_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    mode: text("mode", { enum: QUIZ_MODES }).notNull(),
    // null for practice mode
    roundId: uuid("round_id").references(() => contestRounds.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    // practice: exactly what the student selected. contest: a snapshot of
    // whatever topic restriction was in effect on the round at start time
    // ([] = unrestricted, pooled across every topic in the round's subject+grade)
    topicIds: jsonb("topic_ids").$type<string[]>().notNull().default([]),
    // practice: student-chosen. contest: always QUESTIONS_PER_QUIZ (fixed)
    questionCount: integer("question_count").notNull().default(QUESTIONS_PER_QUIZ),
    // snapshotted from the student's profile at session start
    gradeBand: text("grade_band", { enum: GRADE_BANDS }).notNull(),
    status: text("status", {
      enum: ["in_progress", "completed", "abandoned"],
    })
      .notNull()
      .default("in_progress"),
    score: integer("score"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("quiz_sessions_user_mode_idx").on(table.userId, table.mode),
    // the contest attempt-limit check (countStartedAttempts) filters on
    // exactly this pair, inside the per-user advisory-locked transaction —
    // needs to be a fast index lookup, not a table scan, under load.
    index("quiz_sessions_user_round_idx").on(table.userId, table.roundId),
  ]
);
