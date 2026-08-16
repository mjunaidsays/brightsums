import { createRound } from "@/actions/admin-contests.actions";
import { getAllTopicsWithCounts } from "@/server/db/queries/topics.queries";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoundForm } from "@/components/admin/round-form";
import { GRADE_BAND_LABELS } from "@/lib/constants";

export default async function NewContestRoundPage() {
  const allTopics = await getAllTopicsWithCounts();
  const topics = allTopics.map((t) => ({
    id: t.id,
    name: t.name,
    groupLabel: GRADE_BAND_LABELS[t.gradeBand],
  }));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">New Contest Round</h1>
      <Card>
        <CardHeader>
          <CardTitle>Round Details</CardTitle>
        </CardHeader>
        <RoundForm action={createRound} topics={topics} />
      </Card>
    </main>
  );
}
