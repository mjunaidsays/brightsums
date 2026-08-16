import "server-only";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, schools, attempts, user as authUser } from "@/server/db/schema";

const PAGE_SIZE = 20;

export async function searchStudents(query: string, page = 1) {
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * PAGE_SIZE;
  const term = query.trim();

  const whereClause =
    term.length > 0
      ? and(
          eq(users.role, "student"),
          or(ilike(users.fullName, `%${term}%`), ilike(authUser.email, `%${term}%`))
        )
      : eq(users.role, "student");

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: authUser.email,
        gradeBand: users.gradeBand,
        schoolName: schools.name,
        createdAt: users.createdAt,
        // how many times this student has practiced/played contests, and
        // when they last did — surfaced directly in the list so an admin
        // doesn't have to open every student to see activity at a glance.
        practiceAttempts: sql<number>`count(*) filter (where ${attempts.mode} = 'practice')::int`,
        contestAttempts: sql<number>`count(*) filter (where ${attempts.mode} = 'contest')::int`,
        lastAttemptAt: sql<Date | null>`max(${attempts.createdAt})`,
      })
      .from(users)
      .innerJoin(authUser, eq(users.betterAuthUserId, authUser.id))
      .innerJoin(schools, eq(users.schoolId, schools.id))
      .leftJoin(attempts, eq(attempts.userId, users.id))
      .where(whereClause)
      .groupBy(users.id, authUser.email, schools.name)
      .orderBy(users.createdAt)
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .innerJoin(authUser, eq(users.betterAuthUserId, authUser.id))
      .where(whereClause),
  ]);

  return { rows, page: safePage, pageSize: PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getStudentDetail(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: authUser.email,
      age: users.age,
      parentName: users.parentName,
      parentPhone: users.parentPhone,
      gradeBand: users.gradeBand,
      schoolName: schools.name,
      city: users.city,
      documentVerificationStatus: users.documentVerificationStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(authUser, eq(users.betterAuthUserId, authUser.id))
    .innerJoin(schools, eq(users.schoolId, schools.id))
    .where(eq(users.id, userId));

  return row ?? null;
}
