"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { documentVerifications, users } from "@/server/db/schema";

export async function reviewDocument(
  documentId: string,
  studentUserId: string,
  decision: "approved" | "rejected",
  rejectionReason?: string
) {
  const admin = await requireAdmin();

  await db.transaction(async (tx) => {
    await tx
      .update(documentVerifications)
      .set({
        status: decision,
        reviewedByUserId: admin.id,
        reviewedAt: new Date(),
        rejectionReason: decision === "rejected" ? rejectionReason ?? null : null,
      })
      .where(eq(documentVerifications.id, documentId));

    await tx
      .update(users)
      .set({ documentVerificationStatus: decision })
      .where(eq(users.id, studentUserId));
  });

  revalidatePath(`/admin/users/${studentUserId}`);
}
