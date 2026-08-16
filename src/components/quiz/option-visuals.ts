/**
 * Shared 3D-bevel visual treatment for quiz options, used identically by the
 * live quiz (option-button.tsx) and the post-quiz results review
 * (question-review-card.tsx) so the two never visually drift apart. Single
 * consistent hue (warm primary) for the unanswered state — per the explicit
 * ask, NOT four different colors — with the same raised-bevel technique
 * already used on components/ui/button.tsx, recolored for correct/incorrect.
 */
export type OptionVisualState = "idle" | "correct" | "incorrect" | "muted";

export const OPTION_VISUAL_CLASSES: Record<OptionVisualState, string> = {
  // native `disabled` prevents :hover/:active from ever firing, so this is
  // safe to apply unconditionally — once answered, OptionButton passes
  // disabled=true and these press states simply never trigger again.
  idle: "border-2 border-primary-300 bg-primary-100 text-primary-700 shadow-[0_4px_0_0_var(--color-primary-300)] hover:brightness-105 active:shadow-[0_1px_0_0_var(--color-primary-300)] active:translate-y-[3px]",
  correct:
    "border-2 border-success-600 bg-success-100 text-success-600 shadow-[0_4px_0_0_var(--color-success-500)]",
  incorrect:
    "border-2 border-danger-600 bg-danger-100 text-danger-600 shadow-[0_4px_0_0_var(--color-danger-500)]",
  muted: "border-2 border-border bg-card text-foreground opacity-50",
};
