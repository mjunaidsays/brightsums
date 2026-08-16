"use client";

import { useCallback, useRef, useState } from "react";
import { StaggerContainer } from "@/components/motion/stagger-container";
import { CountUpNumber } from "@/components/motion/count-up-number";
import { TimerRing } from "@/components/motion/timer-ring";
import { Mascot, type MascotMood } from "@/components/motion/mascot";
import { QuestionCard } from "./question-card";
import { OptionButton, type OptionState } from "./option-button";
import { SeeReasonPanel } from "./see-reason-panel";
import { NextQuestionButton } from "./next-question-button";
import { QuizSummaryScreen, type QuizSummary } from "./quiz-summary-screen";

type QuestionPayload = {
  orderIndex: number;
  questionText: string;
  shuffledOptions: (string | number)[];
  deadlineAt: string;
  totalQuestions: number;
};

type AnswerResult = {
  isCorrect: boolean | null;
  timedOut: boolean;
  pointsAwarded: number;
  correctOptionIndex: number;
  explanation: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error?.toString() ?? `Request to ${url} failed (${res.status})`);
  }
  return res.json();
}

/**
 * The full quiz state machine: revealing -> answering -> answered ->
 * nextPending -> ...(repeat)... -> finished. Server is the sole timing
 * authority (see server/quiz/engine.ts) — TimerRing here is display-only.
 */
export function QuizScreen({
  sessionId,
  initialQuestion,
  onDone,
}: {
  sessionId: string;
  initialQuestion: QuestionPayload;
  onDone: () => void;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [answering, setAnswering] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const answerInFlight = useRef(false);

  const submitAnswer = useCallback(
    async (optionIndex: number | null) => {
      if (answerInFlight.current || answer) return;
      answerInFlight.current = true;
      setAnswering(true);
      setSelectedIndex(optionIndex);
      try {
        const result = await postJson<AnswerResult>("/api/quiz/answer", {
          sessionId,
          orderIndex: question.orderIndex,
          selectedOptionIndex: optionIndex,
        });
        setAnswer(result);
        setTotalPoints((p) => p + result.pointsAwarded);
      } finally {
        // Must reset regardless of success/failure, or every question after
        // the first silently stops responding to clicks — this ref is the
        // re-entrancy guard for THIS question only, not a one-time lock.
        answerInFlight.current = false;
        setAnswering(false);
      }
    },
    [answer, question.orderIndex, sessionId]
  );

  const handleTimeExpire = useCallback(() => {
    void submitAnswer(null);
  }, [submitAnswer]);

  const handleNext = useCallback(async () => {
    setAdvancing(true);
    try {
      const result = await postJson<
        { done: true } | { done: false; question: QuestionPayload }
      >("/api/quiz/next", { sessionId, currentOrderIndex: question.orderIndex });

      if (result.done) {
        const finalSummary = await postJson<QuizSummary>("/api/quiz/finish", { sessionId });
        setSummary(finalSummary);
        return;
      }

      setQuestion(result.question);
      setAnswer(null);
      setSelectedIndex(null);
    } finally {
      setAdvancing(false);
    }
  }, [question.orderIndex, sessionId]);

  if (summary) {
    return <QuizSummaryScreen summary={summary} onDone={onDone} />;
  }

  const optionStateFor = (index: number): OptionState => {
    if (!answer) return "idle";
    if (index === answer.correctOptionIndex) return "correct";
    if (index === selectedIndex && index !== answer.correctOptionIndex) return "incorrect";
    return "muted";
  };

  const mascotMood: MascotMood = !answer ? "idle" : answer.isCorrect ? "happy" : "sad";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-tertiary-200 px-4 py-2">
          <span className="text-xl">⭐</span>
          <CountUpNumber value={totalPoints} className="font-display text-xl font-extrabold" />
          <span className="font-display text-sm font-bold text-amber-700">pts</span>
        </div>
        <Mascot mood={mascotMood} size={56} />
        <TimerRing
          key={question.orderIndex}
          deadlineAt={new Date(question.deadlineAt)}
          onExpire={handleTimeExpire}
          paused={!!answer}
        />
      </div>

      <StaggerContainer key={question.orderIndex} className="flex flex-col gap-5">
        <QuestionCard
          orderIndex={question.orderIndex}
          totalQuestions={question.totalQuestions}
          questionText={question.questionText}
        />

        {answer?.timedOut && selectedIndex === null && (
          <p className="font-display text-2xl font-extrabold text-danger-600">Time&apos;s Up!</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {question.shuffledOptions.map((option, index) => (
            <OptionButton
              key={index}
              label={option}
              index={index}
              state={optionStateFor(index)}
              disabled={!!answer || answering}
              onClick={() => submitAnswer(index)}
            />
          ))}
        </div>
      </StaggerContainer>

      {answer && (
        <div className="flex flex-col gap-4">
          <SeeReasonPanel explanation={answer.explanation} />
          <NextQuestionButton
            onClick={handleNext}
            isLast={question.orderIndex === question.totalQuestions - 1}
            loading={advancing}
          />
        </div>
      )}
    </div>
  );
}
