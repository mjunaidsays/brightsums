import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import type { GradeBand } from "@/lib/constants";

/** The raw Better Auth session (credential identity only), or null. */
export async function getAuthSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Full BrightSums profile for the currently authenticated user, or null. */
export async function getCurrentUser() {
  const session = await getAuthSession();
  if (!session) return null;

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, session.user.id))
    .limit(1);

  return profile ?? null;
}

/**
 * A completed student profile — narrows the nullable student-only columns
 * (age/parentName/parentPhone/gradeBand/schoolId, see schema/users.ts) back
 * to non-null. Safe because requireStudent() only ever returns rows that
 * passed the student self-signup flow, which requires all of these; this is
 * the one boundary point where that invariant is asserted, so the rest of
 * the student-facing app (dashboard, practice, leaderboard, ...) never has
 * to deal with them as possibly-null.
 */
export type StudentProfile = typeof users.$inferSelect & {
  age: number;
  parentName: string;
  parentPhone: string;
  gradeBand: GradeBand;
  schoolId: string;
};

/**
 * Use at the top of a student route/layout. Redirects to /login if there's
 * no session at all, to /signup/profile if the student signed up (step 1)
 * but never finished their profile (step 2), and to /admin if this is an
 * admin account — admins have no student profile fields to speak of and
 * should never land on student pages as a side effect of just being logged
 * in (previously requireStudent() let any authenticated profile through
 * regardless of role, which is how an admin ended up on their own "My
 * Board" being asked for a parent/guardian phone number).
 */
export async function requireStudent(): Promise<StudentProfile> {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, session.user.id))
    .limit(1);
  if (!profile) redirect("/signup/profile");
  if (profile.role === "admin") redirect("/admin");

  return profile as StudentProfile;
}

/** Use at the top of an admin route/layout — redirects non-admins away. */
export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, session.user.id))
    .limit(1);
  if (!profile) redirect("/signup/profile");
  if (profile.role !== "admin") redirect("/dashboard");

  return profile;
}
