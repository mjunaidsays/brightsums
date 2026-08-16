import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { documentVerifications, users } from "@/server/db/schema";
import { makeObjectKey, uploadObject } from "@/server/storage/r2-client";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File is too large (10MB max)." }, { status: 413 });
  }
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WEBP, or PDF files are accepted." },
      { status: 415 }
    );
  }

  const key = makeObjectKey(user.id, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadObject(key, buffer, file.type);

  await db.transaction(async (tx) => {
    await tx.insert(documentVerifications).values({
      userId: user.id,
      fileKey: key,
      fileName: file.name,
      status: "pending",
    });
    await tx
      .update(users)
      .set({ documentVerificationStatus: "pending" })
      .where(eq(users.id, user.id));
  });

  return NextResponse.json({ success: true });
}
