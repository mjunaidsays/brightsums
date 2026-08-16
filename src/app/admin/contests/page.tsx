import Link from "next/link";
import { getAllRounds } from "@/server/db/queries/contests-admin.queries";
import { GRADE_BAND_LABELS, type GradeBand } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-tertiary-200 text-amber-700",
  open: "bg-success-100 text-success-600",
  closed: "bg-danger-100 text-danger-600",
};

export default async function AdminContestsPage() {
  const rounds = await getAllRounds();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Contest Rounds</h1>
        <Button render={<Link href="/admin/contests/new" />}>New Round</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rounds.map((round) => (
          <Link key={round.id} href={`/admin/contests/${round.id}/edit`}>
            <Card className="gap-2 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold">{round.name}</span>
                <span
                  className={cn(
                    "rounded-[var(--radius-pill)] px-3 py-1 text-xs font-bold",
                    STATUS_COLORS[round.status]
                  )}
                >
                  {round.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(round.opensAt).toLocaleString()} –{" "}
                {new Date(round.closesAt).toLocaleString()}
              </p>
              <p className="text-sm font-bold text-muted-foreground">
                {(round.gradeBands as GradeBand[])
                  .map((g) => GRADE_BAND_LABELS[g])
                  .join(", ")}{" "}
                · Max {round.maxAttempts} attempt(s)
              </p>
            </Card>
          </Link>
        ))}
        {rounds.length === 0 && (
          <Card className="items-center gap-2 py-10 text-center sm:col-span-2">
            <span className="text-3xl">🏆</span>
            <p className="font-bold text-muted-foreground">No contest rounds yet.</p>
          </Card>
        )}
      </div>
    </main>
  );
}
