import Link from "next/link";
import { getAdminQuestions } from "@/server/db/queries/questions.queries";
import { archiveQuestion, restoreQuestion, deleteQuestion } from "@/actions/admin-questions.actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const result = await getAdminQuestions({ page: Number(page) || 1 });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Question Bank</h1>
        <Button render={<Link href="/admin/questions/upload" />}>Upload Bank</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm font-bold text-muted-foreground">
                <th className="pb-2">Question</th>
                <th className="pb-2">Topic</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((q) => (
                <tr key={q.id} className="border-t border-border transition-colors hover:bg-muted/60">
                  <td className="max-w-sm truncate py-2">{q.questionText}</td>
                  <td className="py-2 text-muted-foreground">{q.topicName}</td>
                  <td className="py-2">
                    <span
                      className={
                        q.status === "active"
                          ? "font-bold text-success-600"
                          : "font-bold text-muted-foreground"
                      }
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="flex flex-wrap items-center gap-2 py-2">
                    <Link href={`/admin/questions/${q.id}/edit`} className="font-bold text-primary-600 underline">
                      Edit
                    </Link>
                    {q.status === "active" ? (
                      <form action={archiveQuestion.bind(null, q.id)}>
                        <button className="font-bold text-destructive underline">Archive</button>
                      </form>
                    ) : (
                      <form action={restoreQuestion.bind(null, q.id)}>
                        <button className="font-bold text-success-600 underline">Restore</button>
                      </form>
                    )}
                    {q.usedCount === 0 ? (
                      <form action={deleteQuestion.bind(null, q.id)}>
                        <ConfirmSubmitButton
                          confirmMessage={`Permanently delete "${q.questionText.slice(0, 60)}"? This cannot be undone.`}
                          className="font-bold text-destructive underline"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">Used in quizzes</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={result.page} totalPages={result.totalPages} basePath="/admin/questions" />
    </main>
  );
}
