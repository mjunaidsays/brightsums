"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Input, Label, FieldError } from "@/components/ui/input";

type SchoolResult = { id: string; name: string; city: string | null };

/**
 * Free-text school entry with live suggestions. Typing always populates
 * `newSchoolName` (so submitting with no suggestion picked just creates that
 * school — no separate "add new" step required, any school can be entered).
 * Clicking a suggestion switches to `schoolId` instead, to avoid creating a
 * duplicate when the school already exists. See CLAUDE.md section 8 / the
 * schools typeahead plan.
 */
export function SchoolTypeahead({ error }: { error?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [selected, setSelected] = useState<SchoolResult | null>(null);
  const [newCity, setNewCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setDropdownOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/schools/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showDropdown = dropdownOpen && !selected && query.trim().length >= 2;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="school-search">School</Label>

      {selected ? (
        <div className="flex items-center justify-between rounded-[var(--radius-control)] border-2 border-primary-300 bg-primary-50 px-4 py-3">
          <span className="font-bold">
            {selected.name}
            {selected.city ? `, ${selected.city}` : ""}
          </span>
          <button
            type="button"
            className="text-sm font-bold text-primary-600 underline"
            onClick={() => {
              setSelected(null);
              setDropdownOpen(true);
            }}
          >
            Change
          </button>
          <input type="hidden" name="schoolId" value={selected.id} />
        </div>
      ) : (
        <div className="relative flex flex-col gap-2">
          <Input
            id="school-search"
            name="newSchoolName"
            placeholder="Type your school's full name..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            autoComplete="off"
            required
          />
          <Input
            name="newSchoolCity"
            placeholder="City (optional)"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
          />

          {showDropdown && (
            <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-control)] border-2 border-border bg-card shadow-lg">
              {loading && <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>}
              {!loading && results.length > 0 && (
                <>
                  <div className="px-4 pt-2 text-xs font-bold uppercase text-muted-foreground">
                    Did you mean...
                  </div>
                  {results.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      // onMouseDown (not onClick) fires before the input's onBlur closes the dropdown
                      onMouseDown={() => {
                        setSelected(school);
                        setDropdownOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left hover:bg-muted"
                    >
                      <span className="font-bold">{school.name}</span>
                      {school.city && (
                        <span className="text-muted-foreground"> · {school.city}</span>
                      )}
                    </button>
                  ))}
                </>
              )}
              {!loading && results.length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No match found — we&apos;ll add <span className="font-bold">&quot;{query}&quot;</span> as
                  a new school.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
}
