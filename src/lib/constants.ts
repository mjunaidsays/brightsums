export const GRADE_BANDS = [
  "grade_1",
  "grade_2",
  "grade_3",
  "grade_4",
  "grade_5",
  "grade_6",
  "grade_7",
  "grade_8",
  "grade_9",
  "grade_10",
  "o_level",
  "a_level",
] as const;

export type GradeBand = (typeof GRADE_BANDS)[number];

export const GRADE_BAND_LABELS: Record<GradeBand, string> = {
  grade_1: "Grade 1",
  grade_2: "Grade 2",
  grade_3: "Grade 3",
  grade_4: "Grade 4",
  grade_5: "Grade 5",
  grade_6: "Grade 6",
  grade_7: "Grade 7",
  grade_8: "Grade 8",
  grade_9: "Grade 9",
  grade_10: "Grade 10",
  o_level: "O-Levels",
  a_level: "Intermediate / A-Levels",
};

export const QUIZ_MODES = ["practice", "contest"] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];

export const USER_ROLES = ["student", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROUND_STATUSES = ["draft", "scheduled", "open", "closed"] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

export const QUESTION_STATUSES = ["active", "archived"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const DOCUMENT_VERIFICATION_STATUSES = [
  "not_submitted",
  "pending",
  "approved",
  "rejected",
] as const;
export type DocumentVerificationStatus =
  (typeof DOCUMENT_VERIFICATION_STATUSES)[number];

export const SCHOOL_STATUSES = ["active", "merged"] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

export const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export const QUESTIONS_PER_QUIZ = 10;
export const POINTS_PER_QUESTION = 10;
export const QUESTION_TIME_LIMIT_MS = 60_000;
/** Grace window added server-side on top of the 60s deadline to absorb network latency. */
export const TIMEOUT_BUFFER_MS = 1_500;
