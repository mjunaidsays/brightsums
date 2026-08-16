import { pgTable, text, timestamp, uuid, integer, jsonb, index } from "drizzle-orm/pg-core";
import { QUESTION_STATUSES } from "@/lib/constants";
import { topics } from "./topics";
import { users } from "./users";

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id),
    questionText: text("question_text").notNull(),
    // stored exactly as provided by the source bank; never mutated at rest —
    // shuffling happens per-attempt at serve time (see sessionQuestions)
    options: jsonb("options").$type<(string | number)[]>().notNull(),
    // derived at import time by matching the source `correct_answer` value
    // against `options`; see server/import/question-bank.importer.ts
    correctOptionIndex: integer("correct_option_index").notNull(),
    explanation: text("explanation").notNull(),
    source: text("source"),
    status: text("status", { enum: QUESTION_STATUSES }).notNull().default("active"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // the quiz-start hot path: "give me every active question for this topic"
    index("questions_topic_status_idx").on(table.topicId, table.status),
  ]
);
