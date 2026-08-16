import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { GradeBand, ROUND_STATUSES } from "@/lib/constants";
import { subjects } from "./subjects";
import { users } from "./users";

export const contestRounds = pgTable("contest_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  gradeBands: jsonb("grade_bands").$type<GradeBand[]>().notNull(),
  // admin-configured topic restriction: [] = unrestricted, pooled across
  // every topic in this round's subject+grade (the default/legacy behavior)
  topicIds: jsonb("topic_ids").$type<string[]>().notNull().default([]),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  maxAttempts: integer("max_attempts").notNull().default(1),
  advanceCountPerGrade: integer("advance_count_per_grade"),
  status: text("status", { enum: ROUND_STATUSES }).notNull().default("draft"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
