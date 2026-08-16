import { db } from "@/server/db/client";
import { questions } from "@/server/db/schema";
import type { AcceptedQuestion } from "./question-bank.importer";

/**
 * The DB-facing half of the import flow — writes only the `accepted` rows
 * from a ValidationReport (see question-bank.importer.ts). Called after the
 * admin has reviewed the dry-run report; rejected rows never reach this
 * function.
 */
export async function commitAcceptedQuestions(
  topicId: string,
  accepted: readonly AcceptedQuestion[],
  source: string,
  createdByUserId?: string
) {
  if (accepted.length === 0) return [];

  return db
    .insert(questions)
    .values(
      accepted.map((q) => ({
        topicId,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        source,
        createdByUserId,
      }))
    )
    .returning();
}
