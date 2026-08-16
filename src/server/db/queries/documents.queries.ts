import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { documentVerifications } from "@/server/db/schema";

export async function getLatestDocumentVerification(userId: string) {
  const [row] = await db
    .select()
    .from(documentVerifications)
    .where(eq(documentVerifications.userId, userId))
    .orderBy(desc(documentVerifications.submittedAt))
    .limit(1);
  return row ?? null;
}
