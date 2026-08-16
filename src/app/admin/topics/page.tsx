import { getAllTopicsWithCounts } from "@/server/db/queries/topics.queries";
import { GRADE_BAND_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { CreateTopicForm } from "@/components/admin/create-topic-form";

export default async function AdminTopicsPage() {
  const topics = await getAllTopicsWithCounts();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Topics</h1>

      <Card>
        <CreateTopicForm />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm font-bold text-muted-foreground">
                <th className="pb-2">Name</th>
                <th className="pb-2">Grade</th>
                <th className="pb-2">Subject</th>
                <th className="pb-2">Questions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.id} className="border-t border-border transition-colors hover:bg-muted/60">
                  <td className="py-2 font-bold">{t.name}</td>
                  <td className="py-2 text-muted-foreground">
                    {GRADE_BAND_LABELS[t.gradeBand as keyof typeof GRADE_BAND_LABELS]}
                  </td>
                  <td className="py-2 text-muted-foreground">{t.subjectName}</td>
                  <td className="py-2 font-bold text-primary-600">{t.questionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
