import { requireStudent } from "@/server/auth/session";
import { getPaginatedAttempts } from "@/server/db/queries/attempts.queries";
import { Card } from "@/components/ui/card";
import { AttemptsTable } from "@/components/dashboard/attempts-table";
import { Pagination } from "@/components/ui/pagination";

export default async function ContestHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireStudent();
  const { page } = await searchParams;
  const result = await getPaginatedAttempts(user.id, "contest", Number(page) || 1);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Contest Attempts</h1>
      <Card>
        <AttemptsTable
          attempts={result.rows.map((a) => ({ ...a, id: a.id }))}
          emptyLabel="Not Attempted Yet"
          emptyIcon="🏆"
        />
      </Card>
      <Pagination page={result.page} totalPages={result.totalPages} basePath="/contest/history" />
    </main>
  );
}
