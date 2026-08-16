import Link from "next/link";
import { requireStudent } from "@/server/auth/session";
import { getDashboardData } from "@/server/db/queries/dashboard.queries";
import { getMyRank } from "@/server/db/queries/leaderboard.queries";
import { GRADE_BAND_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUpNumber } from "@/components/motion/count-up-number";
import { Mascot } from "@/components/motion/mascot";
import { AttemptsChart } from "@/components/dashboard/attempts-chart";
import { AttemptsTable, SeeAllLink } from "@/components/dashboard/attempts-table";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container";

export default async function DashboardPage() {
  const user = await requireStudent();
  const [data, myRank] = await Promise.all([
    getDashboardData(user.id),
    getMyRank({ userId: user.id, gradeBand: user.gradeBand }),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{user.fullName}</h1>
        <p className="font-bold text-muted-foreground">
          {GRADE_BAND_LABELS[user.gradeBand as keyof typeof GRADE_BAND_LABELS]} · ID:{" "}
          {user.id.slice(0, 8)}
        </p>
      </div>

      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <Card className="items-center gap-1 text-center">
            <span className="text-sm font-bold text-muted-foreground">My Rank</span>
            {myRank.rank ? (
              <CountUpNumber
                value={myRank.rank}
                className="font-display text-4xl font-extrabold text-primary-600"
              />
            ) : (
              <Mascot mood="idle" size={40} className="my-1" />
            )}
            <span className="text-xs text-muted-foreground">
              {myRank.rank ? `Best contest score: ${myRank.bestScore}` : "Play a contest to get ranked!"}
            </span>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="items-center gap-1 text-center">
            <span className="text-sm font-bold text-muted-foreground">My Best Practice Score</span>
            <div className="flex items-baseline gap-1">
              <CountUpNumber
                value={data.bestPracticePercentage ?? 0}
                className="font-display text-4xl font-extrabold text-secondary-600"
              />
              <span className="font-display text-lg font-bold text-muted-foreground">%</span>
            </div>
            <span className="text-xs text-muted-foreground">best attempt</span>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="items-center justify-center gap-2 text-center">
            <div className="flex gap-2">
              <Button size="sm" render={<Link href="/practice" />}>
                Practice Now
              </Button>
              <Button size="sm" variant="secondary" render={<Link href="/contest" />}>
                Play Contest
              </Button>
            </div>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      <Card>
        <h2 className="font-display text-lg font-bold">My Progress</h2>
        <AttemptsChart data={data.chartData} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">My Contest Attempts</h2>
            <SeeAllLink href="/contest/history" />
          </div>
          <AttemptsTable
            attempts={data.recentContestAttempts.map((a) => ({ ...a, id: a.id }))}
            emptyLabel="Not Attempted Yet"
            emptyIcon="🏆"
          />
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">My Practice Attempts</h2>
            <SeeAllLink href="/practice/history" />
          </div>
          <AttemptsTable
            attempts={data.recentPracticeAttempts.map((a) => ({ ...a, id: a.id }))}
            emptyLabel="Not Attempted Yet"
            emptyIcon="✏️"
          />
        </Card>
      </div>
    </main>
  );
}
