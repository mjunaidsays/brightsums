import { pgTable, text, timestamp, uuid, integer, date, index } from "drizzle-orm/pg-core";
import { GRADE_BANDS, USER_ROLES, DOCUMENT_VERIFICATION_STATUSES } from "@/lib/constants";
import { schools } from "./schools";

/**
 * BrightSums' own domain profile table — 1:1 with Better Auth's `user` row
 * (see ./auth.ts), linked by `betterAuthUserId`. Holds everything Better Auth
 * doesn't model: role, grade, parent/guardian info, school, etc.
 *
 * age/parentName/parentPhone/gradeBand/schoolId are nullable at the schema
 * level because they're STUDENT-only fields — an admin account has no
 * legitimate age/parent-guardian/grade/school. They stay required at the
 * application layer for the student signup flow (see
 * lib/validation/profile.schema.ts's completeProfileSchema), so real student
 * rows always have them populated; only admin-provisioned rows (created
 * directly, not through self-signup) leave them null. See
 * server/auth/session.ts's requireStudent() for the type-narrowing boundary
 * that lets the rest of the student-facing app treat these as always-present
 * without nullable-handling scattered everywhere.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    betterAuthUserId: text("better_auth_user_id").notNull().unique(),
    role: text("role", { enum: USER_ROLES }).notNull().default("student"),
    fullName: text("full_name").notNull(),
    age: integer("age"),
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),
    gradeBand: text("grade_band", { enum: GRADE_BANDS }),
    schoolId: uuid("school_id").references(() => schools.id),
    city: text("city"),
    gender: text("gender"),
    dateOfBirth: date("date_of_birth"),
    documentVerificationStatus: text("document_verification_status", {
      enum: DOCUMENT_VERIFICATION_STATUSES,
    })
      .notNull()
      .default("not_submitted"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Postgres does not auto-index FK columns — this join (leaderboard,
    // admin school roster, profile lookups) runs on every request that
    // touches a student's school.
    index("users_school_id_idx").on(table.schoolId),
  ]
);
