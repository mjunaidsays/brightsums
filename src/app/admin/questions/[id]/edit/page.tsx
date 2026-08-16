import { notFound } from "next/navigation";
import { getQuestionById } from "@/server/db/queries/questions.queries";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EditQuestionForm } from "@/components/admin/edit-question-form";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await getQuestionById(id);
  if (!question) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Edit Question</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fix a typo or update the content</CardTitle>
        </CardHeader>
        <EditQuestionForm question={question} />
      </Card>
    </main>
  );
}
