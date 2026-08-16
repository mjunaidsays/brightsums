import type { SourceQuestion } from "./question-bank.schema";

export type AcceptedQuestion = {
  sourceId: string | number;
  questionText: string;
  options: (string | number)[];
  correctOptionIndex: number;
  explanation: string;
};

export type RejectedQuestion = {
  sourceId: string | number;
  reason: "correct_answer_not_found" | "ambiguous_correct_answer";
  detail: string;
};

export type ValidationReport = {
  accepted: AcceptedQuestion[];
  rejected: RejectedQuestion[];
};

/**
 * Derives `correctOptionIndex` for each source question by matching
 * `correct_answer` against `options`, per CLAUDE.md section 5's validation rule:
 *   - zero matches -> reject ("correct_answer not found in options")
 *   - >1 match (duplicate option values) -> reject ("ambiguous")
 *   - exactly 1 match -> accept
 *
 * Pure and DB-free — this is the dry-run half of the import flow. The admin
 * sees this report before anything is committed; only `accepted` rows are
 * ever written, and `rejected` rows are never silently dropped without
 * being shown. The actual DB write (creating/looking up the topic, bulk
 * inserting accepted rows) is a separate step in server/import's DB-facing
 * code, not here.
 */
export function validateQuestionBank(questions: readonly SourceQuestion[]): ValidationReport {
  const accepted: AcceptedQuestion[] = [];
  const rejected: RejectedQuestion[] = [];

  for (const q of questions) {
    const matches = q.options.reduce<number[]>((acc, option, index) => {
      if (option === q.correct_answer) acc.push(index);
      return acc;
    }, []);

    if (matches.length === 0) {
      rejected.push({
        sourceId: q.id,
        reason: "correct_answer_not_found",
        detail: `correct_answer (${JSON.stringify(q.correct_answer)}) was not found among options ${JSON.stringify(q.options)}.`,
      });
      continue;
    }

    if (matches.length > 1) {
      rejected.push({
        sourceId: q.id,
        reason: "ambiguous_correct_answer",
        detail: `correct_answer (${JSON.stringify(q.correct_answer)}) matches ${matches.length} duplicate values in options ${JSON.stringify(q.options)}.`,
      });
      continue;
    }

    accepted.push({
      sourceId: q.id,
      questionText: q.question,
      options: q.options,
      correctOptionIndex: matches[0],
      explanation: q.explanation,
    });
  }

  return { accepted, rejected };
}
