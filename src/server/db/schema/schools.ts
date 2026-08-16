import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { SCHOOL_STATUSES } from "@/lib/constants";

export const schools = pgTable(
  "schools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // lowercase, punctuation-stripped — powers the signup typeahead search
    normalizedName: text("normalized_name").notNull(),
    city: text("city"),
    status: text("status", { enum: SCHOOL_STATUSES }).notNull().default("active"),
    // set when status='merged'; points to the canonical row queries should resolve to
    mergedIntoId: uuid("merged_into_id"),
    createdByUserId: uuid("created_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("schools_normalized_name_idx").using(
      "gin",
      sql`${table.normalizedName} gin_trgm_ops`
    ),
  ]
);
