import { z } from "zod";

/** Matches the real sample file's shape (grade2_math_mcqs_v2_varied.json). */
export const sourceQuestionSchema = z.object({
  id: z.union([z.number(), z.string()]),
  question: z.string().min(1),
  options: z.array(z.union([z.string(), z.number()])).min(2),
  correct_answer: z.union([z.string(), z.number()]),
  explanation: z.string().min(1),
});

export const questionBankSchema = z.object({
  title: z.string().optional(),
  total_questions: z.number().optional(),
  questions: z.array(sourceQuestionSchema).min(1),
});

export type SourceQuestion = z.infer<typeof sourceQuestionSchema>;
export type QuestionBank = z.infer<typeof questionBankSchema>;
