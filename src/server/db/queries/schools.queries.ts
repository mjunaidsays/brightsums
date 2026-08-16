import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { schools } from "@/server/db/schema";
import { normalizeSchoolName } from "@/lib/normalize-school-name";

const SEARCH_RESULT_LIMIT = 10;

/**
 * Typeahead search over active schools, using pg_trgm similarity so partial/
 * misspelled queries still surface reasonable matches. Bounded to
 * SEARCH_RESULT_LIMIT — this endpoint is hit on every keystroke during
 * signup, so it must stay fast and cheap regardless of how many schools
 * exist.
 */
export async function searchSchools(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const normalized = normalizeSchoolName(trimmed);

  return db
    .select({ id: schools.id, name: schools.name, city: schools.city })
    .from(schools)
    .where(and(eq(schools.status, "active"), sql`${schools.normalizedName} % ${normalized}`))
    .orderBy(sql`similarity(${schools.normalizedName}, ${normalized}) desc`)
    .limit(SEARCH_RESULT_LIMIT);
}

/**
 * Resolves the school for a signup: either the chosen existing school, or
 * creates a new one (the "add new school" fallback path). Dedup beyond this
 * point (e.g. two students independently adding near-duplicate spellings) is
 * handled by the admin merge tool in Phase 4, not fuzzy-matching here.
 */
export async function resolveOrCreateSchool(input: {
  schoolId?: string;
  newSchoolName?: string;
  newSchoolCity?: string;
  createdByUserId?: string;
}) {
  if (input.schoolId) {
    const [existing] = await db.select().from(schools).where(eq(schools.id, input.schoolId));
    if (!existing) throw new Error("Selected school was not found.");
    return existing;
  }

  if (!input.newSchoolName) {
    throw new Error("Either schoolId or newSchoolName is required.");
  }

  const [created] = await db
    .insert(schools)
    .values({
      name: input.newSchoolName.trim(),
      normalizedName: normalizeSchoolName(input.newSchoolName),
      city: input.newSchoolCity?.trim() || null,
      createdByUserId: input.createdByUserId,
    })
    .returning();
  return created;
}
