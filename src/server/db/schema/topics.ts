import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { GRADE_BANDS } from "@/lib/constants";
import { subjects } from "./subjects";

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    gradeBand: text("grade_band", { enum: GRADE_BANDS }).notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("topics_subject_grade_name_unique").on(table.subjectId, table.gradeBand, table.name)]
);
