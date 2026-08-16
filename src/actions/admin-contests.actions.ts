"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { contestRounds } from "@/server/db/schema";
import { roundSchema } from "@/lib/validation/round.schema";
import { getDefaultSubject } from "@/server/db/queries/topics.queries";

export type RoundFormState = { error?: string };

function parseRoundForm(formData: FormData) {
  return roundSchema.safeParse({
    name: formData.get("name"),
    gradeBands: formData.getAll("gradeBands"),
    topicIds: formData.getAll("topicIds"),
    opensAt: formData.get("opensAt"),
    closesAt: formData.get("closesAt"),
    maxAttempts: formData.get("maxAttempts"),
    advanceCountPerGrade: formData.get("advanceCountPerGrade") || undefined,
    status: formData.get("status"),
  });
}

export async function createRound(
  _prevState: RoundFormState,
  formData: FormData
): Promise<RoundFormState> {
  const admin = await requireAdmin();
  const parsed = parseRoundForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid round details." };
  }

  const subject = await getDefaultSubject();
  if (!subject) return { error: "No subject configured." };

  const [round] = await db
    .insert(contestRounds)
    .values({
      name: parsed.data.name,
      subjectId: subject.id,
      gradeBands: parsed.data.gradeBands,
      topicIds: parsed.data.topicIds,
      opensAt: parsed.data.opensAt,
      closesAt: parsed.data.closesAt,
      maxAttempts: parsed.data.maxAttempts,
      advanceCountPerGrade: parsed.data.advanceCountPerGrade,
      status: parsed.data.status,
      createdByUserId: admin.id,
    })
    .returning();

  revalidatePath("/admin/contests");
  redirect(`/admin/contests/${round.id}/edit`);
}

export async function updateRound(
  roundId: string,
  _prevState: RoundFormState,
  formData: FormData
): Promise<RoundFormState> {
  await requireAdmin();
  const parsed = parseRoundForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid round details." };
  }

  await db
    .update(contestRounds)
    .set({
      name: parsed.data.name,
      gradeBands: parsed.data.gradeBands,
      topicIds: parsed.data.topicIds,
      opensAt: parsed.data.opensAt,
      closesAt: parsed.data.closesAt,
      maxAttempts: parsed.data.maxAttempts,
      advanceCountPerGrade: parsed.data.advanceCountPerGrade,
      status: parsed.data.status,
    })
    .where(eq(contestRounds.id, roundId));

  revalidatePath("/admin/contests");
  revalidatePath(`/admin/contests/${roundId}/edit`);
  return {};
}
