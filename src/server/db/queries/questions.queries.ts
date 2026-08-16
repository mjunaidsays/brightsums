import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { questions, topics, sessionQuestions } from "@/server/db/schema";

const PAGE_SIZE = 20;

export async function getAdminQuestions(input: { topicId?: string; page?: number }) {
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const where = input.topicId ? eq(questions.topicId, input.topicId) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        status: questions.status,
        topicName: topics.name,
        createdAt: questions.createdAt,
        // whether this question has ever been served in a quiz session — a
        // hard delete is only safe when this is 0 (see deleteQuestion)
        usedCount: sql<number>`count(${sessionQuestions.id})::int`,
      })
      .from(questions)
      .innerJoin(topics, eq(questions.topicId, topics.id))
      .leftJoin(sessionQuestions, eq(sessionQuestions.questionId, questions.id))
      .where(where)
      .groupBy(questions.id, topics.name)
      .orderBy(desc(questions.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(questions)
      .where(where),
  ]);

  return { rows, page, pageSize: PAGE_SIZE, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getQuestionById(id: string) {
  const [row] = await db.select().from(questions).where(eq(questions.id, id));
  return row ?? null;
}
