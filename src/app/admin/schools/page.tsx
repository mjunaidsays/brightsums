import { getAllSchoolsWithStudentCounts } from "@/server/db/queries/admin-schools.queries";
import { deleteSchool } from "@/actions/admin-schools.actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MergeSchoolsForm } from "@/components/admin/merge-schools-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { cn } from "@/lib/utils";

export default async function AdminSchoolsPage() {
  const schools = await getAllSchoolsWithStudentCounts();
  // a school other schools have been merged into can't be safely deleted
  // either (see deleteSchool) — computed here from the same already-fetched
  // list rather than an extra query
  const mergeTargetIds = new Set(schools.map((s) => s.mergedIntoId).filter((id): id is string => !!id));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Schools</h1>

      <Card>
        <CardHeader>
          <CardTitle>Merge Duplicates</CardTitle>
          <CardDescription>
            e.g. &quot;LGS&quot; and &quot;Lahore Grammar School&quot; — students move to the
            canonical school and rankings resolve correctly going forward.
          </CardDescription>
        </CardHeader>
        <MergeSchoolsForm schools={schools} />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm font-bold text-muted-foreground">
                <th className="pb-2">Name</th>
                <th className="pb-2">City</th>
                <th className="pb-2">Students</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.id} className="border-t border-border transition-colors hover:bg-muted/60">
                  <td className="py-2 font-bold">{s.name}</td>
                  <td className="py-2 text-muted-foreground">{s.city ?? "—"}</td>
                  <td className="py-2">{s.studentCount}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        "font-bold",
                        s.status === "active" ? "text-success-600" : "text-muted-foreground"
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2">
                    {s.studentCount === 0 && !mergeTargetIds.has(s.id) ? (
                      <form action={deleteSchool.bind(null, s.id)}>
                        <ConfirmSubmitButton
                          confirmMessage={`Permanently delete "${s.name}"? This cannot be undone.`}
                          className="font-bold text-destructive underline"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {s.studentCount > 0 ? "Has students" : "Merge target"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
