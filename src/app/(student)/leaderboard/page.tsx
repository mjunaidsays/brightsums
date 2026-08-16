import Link from "next/link";
import { requireStudent } from "@/server/auth/session";
import {
  getLeaderboard,
  getMyRank,
  getLeaderboardStats,
  getRecentActivity,
} from "@/server/db/queries/leaderboard.queries";
import { getAllRoundsForGrade } from "@/server/db/queries/contests.queries";
import { GRADE_BANDS, GRADE_BAND_LABELS, type GradeBand } from "@/lib/constants";
import { Podium } from "@/components/leaderboard/podium";
import { LeaderboardSearch } from "@/components/leaderboard/leaderboard-search";
import { LeaderboardStats, SparseLeaderboardBanner } from "@/components/leaderboard/leaderboard-stats";
import { RecentActivity } from "@/components/leaderboard/recent-activity";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string; grade?: string; page?: string }>;
}) {
  const user = await requireStudent();
  const params = await searchParams;

  const gradeBand: GradeBand = (params.grade as GradeBand) ?? user.gradeBand;
  const roundId = params.round && params.round !== "all" ? params.round : undefined;
  const page = Number(params.page) || 1;

  const [{ rows, totalPages }, myRank, rounds, stats, recentActivity] = await Promise.all([
    getLeaderboard({ gradeBand, roundId, page }),
    getMyRank({ userId: user.id, gradeBand, roundId }),
    getAllRoundsForGrade(gradeBand),
    getLeaderboardStats({ gradeBand, roundId }),
    getRecentActivity({ gradeBand, roundId }),
  ]);

  const topThree = page === 1 ? rows.slice(0, 3) : [];
  const restRows = page === 1 ? rows.slice(3) : rows;

  const buildHref = (overrides: { round?: string; grade?: string }) => {
    const sp = new URLSearchParams({
      round: overrides.round ?? params.round ?? "all",
      grade: overrides.grade ?? gradeBand,
    });
    return `/leaderboard?${sp.toString()}`;
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold">Champions Board 🏆</h1>
        <div className="rounded-[var(--radius-pill)] bg-primary-500 px-4 py-2 font-display font-bold text-white">
          My Rank {myRank.rank ?? "—"}
        </div>
      </div>

      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <Link
          href={buildHref({ round: "all" })}
          className={cn(
            "shrink-0 rounded-[var(--radius-pill)] border-2 px-4 py-2 font-bold",
            !roundId ? "border-primary-500 bg-primary-500 text-white" : "border-border"
          )}
        >
          All
        </Link>
        {rounds.map((round) => (
          <Link
            key={round.id}
            href={buildHref({ round: round.id })}
            className={cn(
              "shrink-0 rounded-[var(--radius-pill)] border-2 px-4 py-2 font-bold",
              roundId === round.id ? "border-primary-500 bg-primary-500 text-white" : "border-border"
            )}
          >
            {round.name}
          </Link>
        ))}
      </div>

      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {GRADE_BANDS.map((band) => (
          <Link
            key={band}
            href={buildHref({ grade: band })}
            className={cn(
              "shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-bold",
              gradeBand === band ? "bg-secondary-500 text-white" : "bg-muted text-muted-foreground"
            )}
          >
            {GRADE_BAND_LABELS[band]}
          </Link>
        ))}
      </div>

      <LeaderboardStats stats={stats} myRank={myRank.rank} />

      {page === 1 && <Podium topThree={topThree} />}

      {/* Fewer than 4 total contestants means everyone is already visible in
          the podium above (or there's truly nobody yet) — a bare table would
          either be empty or misleadingly say "no scores yet" while scores
          are clearly shown above. Show the encouraging banner instead. */}
      {page === 1 && stats.contestantCount < 4 ? (
        <SparseLeaderboardBanner contestantCount={stats.contestantCount} />
      ) : (
        <LeaderboardSearch rows={restRows} currentUserId={user.id} />
      )}

      <RecentActivity rows={recentActivity} />

      <Pagination page={page} totalPages={totalPages} basePath={buildHref({})} />
    </main>
  );
}
