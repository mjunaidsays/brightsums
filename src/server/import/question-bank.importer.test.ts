import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { questionBankSchema } from "./question-bank.schema";
import { validateQuestionBank } from "./question-bank.importer";

describe("validateQuestionBank against the real sample bank", () => {
  const raw = readFileSync(
    path.resolve(__dirname, "../../../grade2_math_mcqs_v2_varied.json"),
    "utf-8"
  );
  const parsed = questionBankSchema.parse(JSON.parse(raw));

  it("accepts all 100 real questions with none rejected", () => {
    const report = validateQuestionBank(parsed.questions);
    expect(report.accepted).toHaveLength(parsed.questions.length);
    expect(report.rejected).toHaveLength(0);
  });

  it("derives a correctOptionIndex that actually points at the correct_answer value", () => {
    const report = validateQuestionBank(parsed.questions);
    for (const accepted of report.accepted) {
      const source = parsed.questions.find((q) => q.id === accepted.sourceId)!;
      expect(accepted.options[accepted.correctOptionIndex]).toBe(source.correct_answer);
    }
  });
});

describe("validateQuestionBank rejection rules", () => {
  it("rejects a question whose correct_answer is not present in options", () => {
    const report = validateQuestionBank([
      { id: 1, question: "?", options: [1, 2, 3, 4], correct_answer: 99, explanation: "x" },
    ]);
    expect(report.accepted).toHaveLength(0);
    expect(report.rejected[0].reason).toBe("correct_answer_not_found");
  });

  it("rejects a question with a duplicate option value matching correct_answer (ambiguous)", () => {
    const report = validateQuestionBank([
      { id: 2, question: "?", options: [5, 5, 6, 7], correct_answer: 5, explanation: "x" },
    ]);
    expect(report.accepted).toHaveLength(0);
    expect(report.rejected[0].reason).toBe("ambiguous_correct_answer");
  });

  it("accepts the rest of a batch even when one question is rejected", () => {
    const report = validateQuestionBank([
      { id: 1, question: "good", options: [1, 2, 3, 4], correct_answer: 2, explanation: "x" },
      { id: 2, question: "bad", options: [5, 5, 6, 7], correct_answer: 5, explanation: "x" },
    ]);
    expect(report.accepted).toHaveLength(1);
    expect(report.accepted[0].sourceId).toBe(1);
    expect(report.rejected).toHaveLength(1);
    expect(report.rejected[0].sourceId).toBe(2);
  });
});
