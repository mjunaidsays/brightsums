import { notFound } from "next/navigation";
import { requireStudent } from "@/server/auth/session";
import {
  getOwnedSession,
  getCurrentQuestionOrderIndex,
  getQuestionPayload,
} from "@/server/quiz/session-store";
import { ContestQuizClient } from "@/components/quiz/contest-quiz-client";

export default async function ContestSessionPage({
  params,
}: {
  params: Promise<{ roundId: string; sessionId: string }>;
}) {
  const user = await requireStudent();
  const { roundId, sessionId } = await params;

  const session = await getOwnedSession(sessionId, user.id);
  // defense in depth: the session must actually belong to this round/mode,
  // not just this user — guards against a mismatched URL being crafted
  if (!session || session.mode !== "contest" || session.roundId !== roundId) notFound();

  const orderIndex = await getCurrentQuestionOrderIndex(sessionId);
  if (orderIndex === null) notFound();

  const question = await getQuestionPayload(sessionId, orderIndex);
  if (!question) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6">
      <ContestQuizClient sessionId={sessionId} initialQuestion={question} />
    </main>
  );
}
