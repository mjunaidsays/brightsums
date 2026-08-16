"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { questions, sessionQuestions } from "@/server/db/schema";

const optionSplit = (raw: string) =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (Number.isNaN(Number(s)) ? s : Number(s)));

export type UpdateQuestionState = { error?: string; success?: boolean };

export async function updateQuestion(
  questionId: string,
  _prevState: UpdateQuestionState,
  formData: FormData
): Promise<UpdateQuestionState> {
  await requireAdmin();

  const questionText = String(formData.get("questionText") ?? "").trim();
  const optionsRaw = String(formData.get("options") ?? "");
  const correctAnswerRaw = String(formData.get("correctAnswer") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();

  if (!questionText || !optionsRaw || !correctAnswerRaw || !explanation) {
    return { error: "All fields are required." };
  }

  const options = optionSplit(optionsRaw);
  const correctAnswer: string | number = Number.isNaN(Number(correctAnswerRaw))
    ? correctAnswerRaw
    : Number(correctAnswerRaw);

  const matches = options.filter((o) => o === correctAnswer);
  if (matches.length !== 1) {
    return {
      error:
        matches.length === 0
          ? "The correct answer must exactly match one of the options."
          : "Ambiguous: the correct answer matches more than one option.",
    };
  }

  await db
    .update(questions)
    .set({
      questionText,
      options,
      correctOptionIndex: options.indexOf(correctAnswer),
      explanation,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, questionId));

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function archiveQuestion(questionId: string) {
  await requireAdmin();
  await db.update(questions).set({ status: "archived" }).where(eq(questions.id, questionId));
  revalidatePath("/admin/questions");
}

export async function restoreQuestion(questionId: string) {
  await requireAdmin();
  await db.update(questions).set({ status: "active" }).where(eq(questions.id, questionId));
  revalidatePath("/admin/questions");
}

/**
 * Hard-deletes a question — only safe when it's never been served in a quiz
 * session (session_questions would otherwise reference a row that no longer
 * exists, breaking attempt history). The admin/questions list only ever
 * renders this action for questions with zero uses, but the check is
 * repeated here as the real enforcement point, not just a UI courtesy.
 */
export async function deleteQuestion(questionId: string) {
  await requireAdmin();
  const [used] = await db
    .select({ id: sessionQuestions.id })
    .from(sessionQuestions)
    .where(eq(sessionQuestions.questionId, questionId))
    .limit(1);
  if (used) return;
  await db.delete(questions).where(eq(questions.id, questionId));
  revalidatePath("/admin/questions");
}
