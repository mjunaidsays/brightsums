import { NextResponse } from "next/server";
import { z } from "zod";
import { startSession, ContestAttemptsExhaustedError } from "@/server/quiz/session-store";
import { InsufficientQuestionPoolError } from "@/server/quiz/engine";
import { getCurrentUser } from "@/server/auth/session";
import { assertContestEligibility, ContestEligibilityError } from "@/server/db/queries/contests.queries";

const bodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("practice"),
    topicIds: z.array(z.uuid()).min(1),
    questionCount: z.number().int().min(1).max(100),
  }),
  z.object({ mode: z.literal("contest"), roundId: z.uuid() }),
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  // gradeBand is only ever null for admin accounts (see schema/users.ts) —
  // quiz-taking is a student action, so this doubles as the role guard here
  // (Route Handlers can't use next/navigation's redirect() the way
  // requireStudent() does on pages, so this is the equivalent check).
  if (!user.gradeBand) {
    return NextResponse.json({ error: "Only student accounts can take quizzes." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // gradeBand always comes from the authenticated student's own profile,
    // never from the client — prevents a student claiming a different grade
    // to reach a topic/round they're not eligible for.
    if (parsed.data.mode === "practice") {
      const result = await startSession({
        userId: user.id,
        mode: "practice",
        topicIds: parsed.data.topicIds,
        questionCount: parsed.data.questionCount,
        gradeBand: user.gradeBand,
      });
      return NextResponse.json(result);
    }

    const eligibility = await assertContestEligibility(parsed.data.roundId, user.id, user.gradeBand);
    const result = await startSession({
      userId: user.id,
      mode: "contest",
      subjectId: eligibility.round.subjectId,
      gradeBand: user.gradeBand,
      roundId: parsed.data.roundId,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InsufficientQuestionPoolError) {
      return NextResponse.json({ error: err.message, code: "insufficient_pool" }, { status: 422 });
    }
    if (err instanceof ContestEligibilityError || err instanceof ContestAttemptsExhaustedError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to start quiz session." }, { status: 500 });
  }
}
