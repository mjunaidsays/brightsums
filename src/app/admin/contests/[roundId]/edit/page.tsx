import { notFound } from "next/navigation";
import { getRound } from "@/server/db/queries/contests.queries";
import { getAllTopicsWithCounts } from "@/server/db/queries/topics.queries";
import { updateRound } from "@/actions/admin-contests.actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoundForm } from "@/components/admin/round-form";
import { GRADE_BAND_LABELS } from "@/lib/constants";

export default async function EditContestRoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const [round, allTopics] = await Promise.all([getRound(roundId), getAllTopicsWithCounts()]);
  if (!round) notFound();

  const topics = allTopics.map((t) => ({
    id: t.id,
    name: t.name,
    groupLabel: GRADE_BAND_LABELS[t.gradeBand],
  }));

  const boundAction = updateRound.bind(null, roundId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Edit {round.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Round Details</CardTitle>
        </CardHeader>
        <RoundForm round={round} action={boundAction} topics={topics} />
      </Card>
    </main>
  );
}
