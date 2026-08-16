import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { attempts } from "@/server/db/schema";
import type { QuizMode } from "@/lib/constants";

const PAGE_SIZE = 10;

export async function getPaginatedAttempts(userId: string, mode: QuizMode, page: number) {
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * PAGE_SIZE;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.mode, mode)))
      .orderBy(desc(attempts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.mode, mode))),
  ]);

  return { rows, total, page: safePage, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
