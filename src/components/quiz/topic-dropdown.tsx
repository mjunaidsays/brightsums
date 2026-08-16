"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { TopicMultiSelect, type TopicOption } from "./topic-multi-select";

export function TopicDropdown({
  topics,
  defaultSelected,
  selectAllLabel,
}: {
  topics: TopicOption[];
  defaultSelected?: string[];
  selectAllLabel?: string;
}) {
  // Owned here (not inside TopicMultiSelect) because the popover unmounts
  // its popup content on close — checkboxes rendered inside it would
  // disappear from the DOM (and from FormData) the moment it closes. The
  // hidden inputs below are rendered outside the popover, so they stay
  // mounted and submit correctly regardless of whether the dropdown is open.
  const [selected, setSelected] = useState<string[]>(defaultSelected ?? topics.map((t) => t.id));

  const summary =
    topics.length === 0
      ? "No topics available"
      : selected.length === 0
        ? "No topics selected"
        : selected.length === topics.length
          ? "All Topics"
          : `${selected.length} of ${topics.length} topics`;

  return (
    <Popover>
      <PopoverTrigger className="flex h-12 w-full items-center justify-between rounded-[var(--radius-control)] border-2 border-border bg-card px-4 text-base font-bold text-foreground transition-colors hover:border-primary-400">
        <span>{summary}</span>
        <span aria-hidden className="text-muted-foreground">▾</span>
      </PopoverTrigger>
      <PopoverContent align="start">
        <TopicMultiSelect
          topics={topics}
          defaultSelected={selected}
          selectAllLabel={selectAllLabel}
          onSelectionChange={setSelected}
          formField={false}
        />
      </PopoverContent>
      {selected.map((id) => (
        <input key={id} type="hidden" name="topicIds" value={id} />
      ))}
    </Popover>
  );
}
