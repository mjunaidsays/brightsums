import { describe, it, expect } from "vitest";
import { parseQuestionBankCsv } from "./csv-importer";
import { validateQuestionBank } from "./question-bank.importer";

describe("parseQuestionBankCsv", () => {
  it("parses a well-formed CSV into the source question shape", () => {
    const csv = [
      "id,question,option1,option2,option3,option4,correct_answer,explanation",
      '1,"What is 2 x 3?",5,6,7,8,6,"2 groups of 3 is 6."',
      '2,"What is 4 x 4?",14,15,16,17,16,"4 groups of 4 is 16."',
    ].join("\n");

    const parsed = parseQuestionBankCsv(csv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      id: 1,
      question: "What is 2 x 3?",
      options: [5, 6, 7, 8],
      correct_answer: 6,
      explanation: "2 groups of 3 is 6.",
    });
  });

  it("handles commas inside quoted fields", () => {
    const csv = [
      "id,question,option1,option2,correct_answer,explanation",
      '1,"Pick the bigger, better answer",A,B,B,"B is bigger, hence correct"',
    ].join("\n");
    const parsed = parseQuestionBankCsv(csv);
    expect(parsed[0].question).toBe("Pick the bigger, better answer");
    expect(parsed[0].explanation).toBe("B is bigger, hence correct");
  });

  it("throws a clear error when required columns are missing", () => {
    const csv = "question,correct_answer\nWhat is 1+1?,2";
    expect(() => parseQuestionBankCsv(csv)).toThrow(/must have at least/i);
  });

  it("round-trips through the real validator with zero rejections for well-formed CSV", () => {
    const csv = [
      "id,question,option1,option2,option3,option4,correct_answer,explanation",
      '1,"What is 3 x 3?",8,9,10,11,9,"3 groups of 3 is 9."',
    ].join("\n");
    const parsed = parseQuestionBankCsv(csv);
    const report = validateQuestionBank(parsed);
    expect(report.accepted).toHaveLength(1);
    expect(report.rejected).toHaveLength(0);
  });
});
