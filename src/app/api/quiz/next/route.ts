import { NextResponse } from "next/server";
import { z } from "zod";
import { nextQuestion, getOwnedSession, QuizSessionError } from "@/server/quiz/session-store";
import { getCurrentUser } from "@/server/auth/session";

// Not tied to QUESTIONS_PER_QUIZ — practice sessions can have a
// student-chosen question count. This is just a generous sanity bound; the
// real enforcement is the sessionQuestions row lookup in session-store.ts.
const bodySchema = z.object({
  sessionId: z.uuid(),
  currentOrderIndex: z.number().int().min(0).max(199),
});

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
    const result = await nextQuestion(parsed.data.sessionId, parsed.data.currentOrderIndex);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof QuizSessionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to advance to next question." }, { status: 500 });
  }
}
