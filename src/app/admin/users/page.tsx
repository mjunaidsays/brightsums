import Link from "next/link";
import { searchStudents } from "@/server/db/queries/admin-users.queries";
import { deleteUser } from "@/actions/admin-users.actions";
import { GRADE_BAND_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page } = await searchParams;
  const result = await searchStudents(q, Number(page) || 1);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Students</h1>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Search by name or email..." />
        <Button type="submit">Search</Button>
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm font-bold text-muted-foreground">
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Grade</th>
                <th className="pb-2">School</th>
                <th className="pb-2">Practice</th>
                <th className="pb-2">Contest</th>
                <th className="pb-2">Last Attempt</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((u) => (
                <tr key={u.id} className="border-t border-border transition-colors hover:bg-muted/60">
                  <td className="py-2">
                    <Link href={`/admin/users/${u.id}`} className="font-bold text-primary-600 underline">
                      {u.fullName}
                    </Link>
                  </td>
                  <td className="py-2 text-muted-foreground">{u.email}</td>
                  <td className="py-2">{GRADE_BAND_LABELS[u.gradeBand as keyof typeof GRADE_BAND_LABELS]}</td>
                  <td className="py-2 text-muted-foreground">{u.schoolName}</td>
                  <td className="py-2 text-center font-bold text-primary-600">{u.practiceAttempts}</td>
                  <td className="py-2 text-center font-bold text-secondary-600">{u.contestAttempts}</td>
                  <td className="py-2 text-sm text-muted-foreground whitespace-nowrap">
                    {u.lastAttemptAt
                      ? new Date(u.lastAttemptAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Never"}
                  </td>
                  <td className="py-2">
                    <form action={deleteUser.bind(null, u.id)}>
                      <ConfirmSubmitButton
                        confirmMessage={`Permanently delete ${u.fullName}? This removes all their quiz sessions, attempts, and leaderboard history. This cannot be undone.`}
                        className="font-bold text-destructive underline"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={`/admin/users?q=${encodeURIComponent(q)}`}
      />
    </main>
  );
}
