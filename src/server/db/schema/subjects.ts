import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// 'math' today; architecture deliberately does not hardcode "math" anywhere
// downstream so English/Urdu/Science can be added as more rows later.
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
