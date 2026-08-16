import { z } from "zod";
import { GRADE_BANDS, ROUND_STATUSES } from "@/lib/constants";

export const roundSchema = z
  .object({
    name: z.string().trim().min(2),
    gradeBands: z.array(z.enum(GRADE_BANDS)).min(1, "Pick at least one grade."),
    // empty = unrestricted, pooled across every topic in the round's subject+grade
    topicIds: z.array(z.uuid()).optional().default([]),
    opensAt: z.coerce.date(),
    closesAt: z.coerce.date(),
    maxAttempts: z.coerce.number().int().min(1),
    advanceCountPerGrade: z.coerce.number().int().min(1).optional(),
    status: z.enum(ROUND_STATUSES),
  })
  .refine((data) => data.closesAt > data.opensAt, {
    message: "Close date must be after the open date.",
    path: ["closesAt"],
  });

export type RoundInput = z.infer<typeof roundSchema>;
