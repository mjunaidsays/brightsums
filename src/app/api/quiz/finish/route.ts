import { NextResponse } from "next/server";
import { z } from "zod";
import { finishSession, getOwnedSession, QuizSessionError } from "@/server/quiz/session-store";
import { getCurrentUser } from "@/server/auth/session";

const bodySchema = z.object({ sessionId: z.uuid() });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getOwnedSession(parsed.data.sessionId, user.id);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  try {
    const result = await finishSession(parsed.data.sessionId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof QuizSessionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to finish quiz session." }, { status: 500 });
  }
}
