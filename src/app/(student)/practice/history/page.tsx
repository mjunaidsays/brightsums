import Link from "next/link";
import { requireStudent } from "@/server/auth/session";
import { getPaginatedAttempts } from "@/server/db/queries/attempts.queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttemptsTable } from "@/components/dashboard/attempts-table";
import { Pagination } from "@/components/ui/pagination";

export default async function PracticeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireStudent();
  const { page } = await searchParams;
  const result = await getPaginatedAttempts(user.id, "practice", Number(page) || 1);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Practice Attempts</h1>
        <Button size="sm" render={<Link href="/practice" />}>
          Practice Now
        </Button>
      </div>
      <Card>
        <AttemptsTable
          attempts={result.rows.map((a) => ({ ...a, id: a.id }))}
          emptyLabel="Not Attempted Yet"
          emptyIcon="✏️"
        />
      </Card>
      <Pagination page={result.page} totalPages={result.totalPages} basePath="/practice/history" />
    </main>
  );
}
