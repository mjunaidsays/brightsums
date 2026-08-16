import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import type { GradeBand } from "@/lib/constants";

const PAGE_SIZE = 20;

export type LeaderboardRow = {
  rank: number;
  userId: string;
  fullName: string;
  schoolName: string;
  city: string | null;
  bestScore: number;
  bestTimeMs: number;
};

/**
 * Ranks students by their BEST contest score within the given scope
 * (grade band, optionally narrowed to one round), using a real SQL window
 * function so ranking happens in the database, not in application code —
 * this is the query that has to stay fast as the student count grows into
 * the thousands, so it's a single indexed aggregate + window pass, not an
 * N+1 or an in-memory sort. Merged schools resolve to their canonical row
 * (see schools.mergedIntoId) so a school-name merge doesn't fragment a
 * student's historical ranking.
 *
 * Ties on score are broken by total_time_ms (faster attempt ranks higher).
 * `DISTINCT ON` (rather than a plain `MAX(score)` aggregate) is required
 * here specifically so the picked row's time stays attached to its score —
 * an aggregate would tell us the best score a user ever got, but not which
 * attempt (and thus which duration) produced it.
 */
export async function getLeaderboard(input: {
  gradeBand: GradeBand;
  roundId?: string;
  page?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const roundFilter = input.roundId ? sql`and a.round_id = ${input.roundId}` : sql``;

  const rows = await db.execute<{
    user_id: string;
    full_name: string;
    school_name: string;
    city: string | null;
    best_score: number;
    best_time_ms: number;
    rnk: number;
  }>(sql`
    with best_attempts as (
      select distinct on (a.user_id)
        a.user_id, a.score as best_score, a.total_time_ms as best_time_ms
      from attempts a
      where a.mode = 'contest' and a.grade_band = ${input.gradeBand} ${roundFilter}
      order by a.user_id, a.score desc, a.total_time_ms asc, a.created_at asc
    ),
    ranked as (
      select
        ba.user_id,
        ba.best_score,
        ba.best_time_ms,
        rank() over (order by ba.best_score desc, ba.best_time_ms asc) as rnk
      from best_attempts ba
    )
    select
      r.user_id,
      u.full_name,
      coalesce(canonical.name, s.name) as school_name,
      coalesce(canonical.city, s.city) as city,
      r.best_score,
      r.best_time_ms,
      r.rnk
    from ranked r
    join users u on u.id = r.user_id
    join schools s on s.id = u.school_id
    left join schools canonical on canonical.id = s.merged_into_id
    order by r.rnk asc
    limit ${PAGE_SIZE} offset ${offset}
  `);

  const totalResult = await db.execute<{ total: number }>(sql`
    select count(*)::int as total
    from (
      select a.user_id
      from attempts a
      where a.mode = 'contest' and a.grade_band = ${input.gradeBand} ${roundFilter}
      group by a.user_id
    ) t
  `);
  const total = Number(totalResult.rows[0]?.total ?? 0);

  const leaderboard: LeaderboardRow[] = rows.rows.map((r) => ({
    rank: Number(r.rnk),
    userId: r.user_id,
    fullName: r.full_name,
    schoolName: r.school_name,
    city: r.city,
    bestScore: Number(r.best_score),
    bestTimeMs: Number(r.best_time_ms),
  }));

  return {
    rows: leaderboard,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export type LeaderboardStats = {
  contestantCount: number;
  averageScore: number | null;
  topScore: number | null;
};

/**
 * Summary stats for the stats strip above the leaderboard — reuses the same
 * best-scores-per-user aggregation as getLeaderboard, so the numbers here
 * always agree with what's rendered in the podium/table below.
 */
export async function getLeaderboardStats(input: {
  gradeBand: GradeBand;
  roundId?: string;
}): Promise<LeaderboardStats> {
  const roundFilter = input.roundId ? sql`and a.round_id = ${input.roundId}` : sql``;

  const result = await db.execute<{
    contestant_count: number;
    average_score: number | null;
    top_score: number | null;
  }>(sql`
    with best_scores as (
      select a.user_id, max(a.score) as best_score
      from attempts a
      where a.mode = 'contest' and a.grade_band = ${input.gradeBand} ${roundFilter}
      group by a.user_id
    )
    select
      count(*)::int as contestant_count,
      avg(best_score) as average_score,
      max(best_score) as top_score
    from best_scores
  `);

  const row = result.rows[0];
  return {
    contestantCount: Number(row?.contestant_count ?? 0),
    averageScore: row?.average_score != null ? Math.round(Number(row.average_score)) : null,
    topScore: row?.top_score != null ? Number(row.top_score) : null,
  };
}

export type RecentActivityRow = {
  userId: string;
  fullName: string;
  score: number;
  roundName: string | null;
  createdAt: Date;
};

/**
 * Latest handful of contest submissions in scope, newest first — gives the
 * page a "live" feel. Deliberately small (limit 8) since this is a glance
 * feature, not a full activity log.
 */
export async function getRecentActivity(input: {
  gradeBand: GradeBand;
  roundId?: string;
  limit?: number;
}): Promise<RecentActivityRow[]> {
  const roundFilter = input.roundId ? sql`and a.round_id = ${input.roundId}` : sql``;
  const limit = input.limit ?? 8;

  const result = await db.execute<{
    user_id: string;
    full_name: string;
    score: number;
    round_name: string | null;
    created_at: Date;
  }>(sql`
    select a.user_id, u.full_name, a.score, cr.name as round_name, a.created_at
    from attempts a
    join users u on u.id = a.user_id
    left join contest_rounds cr on cr.id = a.round_id
    where a.mode = 'contest' and a.grade_band = ${input.gradeBand} ${roundFilter}
    order by a.created_at desc
    limit ${limit}
  `);

  return result.rows.map((r) => ({
    userId: r.user_id,
    fullName: r.full_name,
    score: Number(r.score),
    roundName: r.round_name,
    createdAt: new Date(r.created_at),
  }));
}

/** The current student's own rank in a scope, even if it falls outside the current page. */
export async function getMyRank(input: { userId: string; gradeBand: GradeBand; roundId?: string }) {
  const roundFilter = input.roundId ? sql`and a.round_id = ${input.roundId}` : sql``;

  const result = await db.execute<{
    rnk: number | null;
    best_score: number | null;
    best_time_ms: number | null;
  }>(sql`
    with best_attempts as (
      select distinct on (a.user_id)
        a.user_id, a.score as best_score, a.total_time_ms as best_time_ms
      from attempts a
      where a.mode = 'contest' and a.grade_band = ${input.gradeBand} ${roundFilter}
      order by a.user_id, a.score desc, a.total_time_ms asc, a.created_at asc
    ),
    ranked as (
      select
        ba.user_id,
        ba.best_score,
        ba.best_time_ms,
        rank() over (order by ba.best_score desc, ba.best_time_ms asc) as rnk
      from best_attempts ba
    )
    select rnk, best_score, best_time_ms from ranked where user_id = ${input.userId}
  `);

  const row = result.rows[0] as
    | { rnk: number | null; best_score: number | null; best_time_ms: number | null }
    | undefined;
  return {
    rank: row?.rnk != null ? Number(row.rnk) : null,
    bestScore: row?.best_score != null ? Number(row.best_score) : null,
    bestTimeMs: row?.best_time_ms != null ? Number(row.best_time_ms) : null,
  };
}
