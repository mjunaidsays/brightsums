import { z } from "zod";
import { GRADE_BANDS } from "@/lib/constants";

const baseProfileFields = {
  fullName: z.string().trim().min(2, "Enter the student's full name."),
  age: z.coerce.number().int().min(3).max(25),
  parentName: z.string().trim().min(2, "Enter a parent/guardian name."),
  parentPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20),
  gradeBand: z.enum(GRADE_BANDS),
  city: z.string().trim().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(), // yyyy-mm-dd from <input type=date>
};

/** Step 2 of signup — school is resolved via EITHER an existing schoolId OR a new school name. */
export const completeProfileSchema = z
  .object({
    ...baseProfileFields,
    schoolId: z.uuid().optional(),
    newSchoolName: z.string().trim().optional(),
    newSchoolCity: z.string().trim().optional(),
  })
  .refine((data) => !!data.schoolId || !!data.newSchoolName, {
    message: "Select your school, or add it if it's not listed.",
    path: ["schoolId"],
  });

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

/** Profile edit form — school is locked after signup (changing schools mid-year would fragment leaderboard history). */
export const updateProfileSchema = z.object(baseProfileFields);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
