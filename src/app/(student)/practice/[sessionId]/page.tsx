import { notFound } from "next/navigation";
import { requireStudent } from "@/server/auth/session";
import {
  getOwnedSession,
  getCurrentQuestionOrderIndex,
  getQuestionPayload,
} from "@/server/quiz/session-store";
import { PracticeQuizClient } from "@/components/quiz/practice-quiz-client";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireStudent();
  const { sessionId } = await params;

  const session = await getOwnedSession(sessionId, user.id);
  if (!session) notFound();

  const orderIndex = await getCurrentQuestionOrderIndex(sessionId);
  if (orderIndex === null) notFound();

  const question = await getQuestionPayload(sessionId, orderIndex);
  if (!question) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6">
      <PracticeQuizClient sessionId={sessionId} initialQuestion={question} />
    </main>
  );
}
