"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type TopicOption = {
  id: string;
  name: string;
  groupLabel?: string;
};

/**
 * Controlled checkbox-pill multi-select, submitted via `name="topicIds"` in
 * the surrounding <form>. Mirrors the checkbox-pill pattern already used for
 * `gradeBands` in admin/round-form.tsx, but controlled (needed for the
 * "Select All"/"Deselect All" toggle) and grouped by `groupLabel` when
 * present (topics from different grades sharing one list, e.g. the admin
 * round-topic picker).
 */
export function TopicMultiSelect({
  topics,
  defaultSelected,
  selectAllLabel = "Select All",
  onSelectionChange,
  formField = true,
}: {
  topics: TopicOption[];
  defaultSelected?: string[];
  selectAllLabel?: string;
  /** Fired whenever the selection changes — optional, for callers (e.g. a dropdown trigger) that need to summarize it. */
  onSelectionChange?: (selected: string[]) => void;
  /**
   * Whether the checkboxes carry `name="topicIds"` and submit directly with
   * the surrounding form. Set to `false` when this list is rendered inside a
   * popover/dropdown that unmounts on close (e.g. TopicDropdown) — the
   * checkboxes would otherwise vanish from the DOM (and from FormData) the
   * moment the dropdown closes, silently dropping the selection. In that
   * case the parent tracks selection via `onSelectionChange` and renders its
   * own always-mounted hidden inputs instead.
   */
  formField?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultSelected ?? topics.map((t) => t.id))
  );

  useEffect(() => {
    onSelectionChange?.(Array.from(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const allSelected = topics.length > 0 && selected.size === topics.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(topics.map((t) => t.id)));
  }

  const groups = new Map<string | undefined, TopicOption[]>();
  for (const topic of topics) {
    const key = topic.groupLabel;
    const list = groups.get(key);
    if (list) list.push(topic);
    else groups.set(key, [topic]);
  }

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="outline" size="sm" onClick={toggleAll} className="self-start">
        {allSelected ? `Deselect All` : selectAllLabel}
      </Button>

      <div className="flex flex-col gap-3">
        {Array.from(groups.entries()).map(([groupLabel, groupTopics]) => (
          <div key={groupLabel ?? "__ungrouped"} className="flex flex-col gap-1.5">
            {groupLabel && (
              <span className="text-xs font-bold text-muted-foreground">{groupLabel}</span>
            )}
            <div className="flex flex-wrap gap-2">
              {groupTopics.map((topic) => (
                <label
                  key={topic.id}
                  className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border-2 border-border px-3 py-1.5 text-sm font-bold has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
                >
                  <input
                    type="checkbox"
                    name={formField ? "topicIds" : undefined}
                    value={topic.id}
                    checked={selected.has(topic.id)}
                    onChange={() => toggle(topic.id)}
                  />
                  {topic.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
