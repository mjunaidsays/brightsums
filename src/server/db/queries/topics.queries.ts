import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { topics, questions, subjects } from "@/server/db/schema";
import type { GradeBand } from "@/lib/constants";

/**
 * Topics for a grade band that have >=1 active question (so students never
 * see a topic that would immediately fail to build a session). A single
 * topic no longer needs to independently cover a full quiz — students can
 * multi-select topics and choose their own question count, and the actual
 * sufficiency check (topic selection + question count vs. combined pool
 * size) happens at session-start time (see InsufficientQuestionPoolError).
 */
export async function getPlayableTopicsForGrade(gradeBand: GradeBand) {
  return db
    .select({
      id: topics.id,
      name: topics.name,
      subjectName: subjects.name,
      questionCount: sql<number>`count(${questions.id})::int`,
    })
    .from(topics)
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .leftJoin(questions, and(eq(questions.topicId, topics.id), eq(questions.status, "active")))
    .where(eq(topics.gradeBand, gradeBand))
    .groupBy(topics.id, subjects.name)
    .having(sql`count(${questions.id}) >= 1`);
}

/** All topics with their question counts, for admin browsing — no minimum-question filter. */
export async function getAllTopicsWithCounts() {
  return db
    .select({
      id: topics.id,
      name: topics.name,
      gradeBand: topics.gradeBand,
      subjectId: topics.subjectId,
      subjectName: subjects.name,
      questionCount: sql<number>`count(${questions.id})::int`,
      createdAt: topics.createdAt,
    })
    .from(topics)
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .leftJoin(questions, and(eq(questions.topicId, topics.id), eq(questions.status, "active")))
    .groupBy(topics.id, subjects.name)
    .orderBy(desc(topics.createdAt));
}

export async function getOrCreateTopic(input: { subjectId: string; gradeBand: GradeBand; name: string }) {
  const [existing] = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, input.subjectId),
        eq(topics.gradeBand, input.gradeBand),
        eq(topics.name, input.name.trim())
      )
    );
  if (existing) return existing;

  const [created] = await db
    .insert(topics)
    .values({ subjectId: input.subjectId, gradeBand: input.gradeBand, name: input.name.trim() })
    .returning();
  return created;
}

export async function getDefaultSubject() {
  const [subject] = await db.select().from(subjects).where(eq(subjects.slug, "math"));
  return subject ?? null;
}
