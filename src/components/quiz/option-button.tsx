"use client";

import { cn } from "@/lib/utils";
import { StaggerItem } from "@/components/motion/stagger-container";
import { OPTION_VISUAL_CLASSES, type OptionVisualState } from "./option-visuals";
import { OPTION_LETTERS } from "@/lib/constants";

export type OptionState = OptionVisualState;

export function OptionButton({
  label,
  index,
  state,
  disabled,
  onClick,
}: {
  label: string | number;
  index: number;
  state: OptionState;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <StaggerItem>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "flex w-full min-h-14 items-center gap-3 rounded-[var(--radius-control)] px-5 py-3 text-left font-display text-lg font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:active:translate-y-0",
          OPTION_VISUAL_CLASSES[state]
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current text-sm">
          {OPTION_LETTERS[index]}
        </span>
        <span>{label}</span>
      </button>
    </StaggerItem>
  );
}
