import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { schools, users } from "@/server/db/schema";

export async function getAllSchoolsWithStudentCounts() {
  return db
    .select({
      id: schools.id,
      name: schools.name,
      city: schools.city,
      status: schools.status,
      mergedIntoId: schools.mergedIntoId,
      studentCount: sql<number>`count(${users.id})::int`,
    })
    .from(schools)
    .leftJoin(users, eq(users.schoolId, schools.id))
    .groupBy(schools.id)
    .orderBy(asc(schools.name));
}
