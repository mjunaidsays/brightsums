import {
  pgTable,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { quizSessions } from "./quiz-sessions";
import { questions } from "./questions";

/**
 * THE server-timing-authority table. `servedAt`/`deadlineAt` are set by the
 * server (never trust a client timestamp) and every answer submission is
 * validated against `deadlineAt` server-side in api/quiz/answer — see
 * server/quiz/engine.ts's TIMEOUT_BUFFER_MS. This table is also the full
 * per-question audit trail for attempt history and future dispute resolution.
 */
export const sessionQuestions = pgTable(
  "session_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => quizSessions.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id),
    orderIndex: integer("order_index").notNull(), // 0-9
    // the actual per-attempt shuffled options served to the student
    shuffledOptions: jsonb("shuffled_options").$type<(string | number)[]>().notNull(),
    correctOptionIndexShuffled: integer("correct_option_index_shuffled").notNull(),
    servedAt: timestamp("served_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    selectedOptionIndex: integer("selected_option_index"),
    isCorrect: boolean("is_correct"),
    timedOut: boolean("timed_out").notNull().default(false),
    pointsAwarded: integer("points_awarded").notNull().default(0),
  },
  (table) => [
    unique("session_questions_session_order_unique").on(table.sessionId, table.orderIndex),
    index("session_questions_session_idx").on(table.sessionId),
  ]
);
