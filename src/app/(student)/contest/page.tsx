import { requireStudent } from "@/server/auth/session";
import { getAllRoundsForGrade, getRoundAttemptStatus } from "@/server/db/queries/contests.queries";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StartContestButton } from "@/components/quiz/start-contest-button";

export default async function ContestPage() {
  const user = await requireStudent();
  const rounds = await getAllRoundsForGrade(user.gradeBand);

  const statuses = await Promise.all(
    rounds.map((round) => getRoundAttemptStatus(round.id, user.id))
  );

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Contest Rounds</h1>

      {rounds.length === 0 ? (
        <Card className="items-center gap-2 py-10 text-center">
          <span className="text-3xl">🏆</span>
          <p className="font-bold text-muted-foreground">
            No contest rounds are open for your grade right now — check back soon!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rounds.map((round, i) => {
            const status = statuses[i];
            const badge =
              round.status !== "open"
                ? round.status === "draft" || round.status === "scheduled"
                  ? "Not Started Yet"
                  : "Closed"
                : status?.canPlay
                  ? `${status.attemptsRemaining} attempt(s) left`
                  : "No attempts remaining";

            return (
              <Card key={round.id}>
                <CardHeader>
                  <CardTitle>{round.name}</CardTitle>
                  <CardDescription>
                    {new Date(round.opensAt).toLocaleDateString()} –{" "}
                    {new Date(round.closesAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <p className="text-sm font-bold text-muted-foreground">{badge}</p>
                <StartContestButton
                  roundId={round.id}
                  subjectId={round.subjectId}
                  disabled={!status?.canPlay}
                />
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
