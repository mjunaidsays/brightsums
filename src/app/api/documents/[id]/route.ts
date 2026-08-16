import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { documentVerifications } from "@/server/db/schema";
import { readObject } from "@/server/storage/r2-client";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const [doc] = await db.select().from(documentVerifications).where(eq(documentVerifications.id, id));
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // students may only view their own document; admins may view any
  if (doc.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const object = await readObject(doc.fileKey);
  if (!object) return NextResponse.json({ error: "File not found in storage." }, { status: 404 });

  return new NextResponse(new Uint8Array(object.data), {
    headers: {
      "Content-Type": object.contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${doc.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
