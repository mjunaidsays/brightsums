"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { LeaderboardTable } from "./leaderboard-table";
import type { LeaderboardRow } from "@/server/db/queries/leaderboard.queries";

/**
 * Client-side name/school filter over the current page's rows. Deliberately
 * scoped to the current page (not a server round-trip) — leaderboard pages
 * are small (20 rows), and this is a "find yourself/a friend" convenience,
 * not a full search feature.
 */
export function LeaderboardSearch({
  rows,
  currentUserId,
}: {
  rows: LeaderboardRow[];
  currentUserId?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) => row.fullName.toLowerCase().includes(q) || row.schoolName.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-3">
      {rows.length > 0 && (
        <Input
          type="search"
          placeholder="Search by name or school..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search leaderboard by name or school"
        />
      )}
      <LeaderboardTable rows={filtered} currentUserId={currentUserId} />
    </div>
  );
}
