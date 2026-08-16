"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { getOrCreateTopic, getDefaultSubject } from "@/server/db/queries/topics.queries";
import { GRADE_BANDS } from "@/lib/constants";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2),
  gradeBand: z.enum(GRADE_BANDS),
});

export type CreateTopicState = { error?: string; success?: boolean };

export async function createTopic(
  _prevState: CreateTopicState,
  formData: FormData
): Promise<CreateTopicState> {
  await requireAdmin();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a topic name and pick a grade." };

  const subject = await getDefaultSubject();
  if (!subject) return { error: "No subject configured." };

  await getOrCreateTopic({ subjectId: subject.id, gradeBand: parsed.data.gradeBand, name: parsed.data.name });
  revalidatePath("/admin/topics");
  return { success: true };
}
