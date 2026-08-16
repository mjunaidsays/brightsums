"use client";

import { useRouter } from "next/navigation";
import { QuizScreen } from "./quiz-screen";

type QuestionPayload = {
  orderIndex: number;
  questionText: string;
  shuffledOptions: (string | number)[];
  deadlineAt: string;
  totalQuestions: number;
};

export function PracticeQuizClient({
  sessionId,
  initialQuestion,
}: {
  sessionId: string;
  initialQuestion: QuestionPayload;
}) {
  const router = useRouter();
  return (
    <QuizScreen
      sessionId={sessionId}
      initialQuestion={initialQuestion}
      onDone={() => router.push("/practice")}
    />
  );
}
