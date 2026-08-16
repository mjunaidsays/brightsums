import { getAllTopicsWithCounts } from "@/server/db/queries/topics.queries";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QuestionBankUploader } from "@/components/admin/question-bank-uploader";

export default async function UploadQuestionBankPage() {
  const topics = await getAllTopicsWithCounts();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Upload Question Bank</h1>
      <Card>
        <CardHeader>
          <CardTitle>JSON or CSV Upload</CardTitle>
          <CardDescription>
            Validate first — you&apos;ll see exactly what will be imported and what&apos;s
            rejected (with reasons) before anything is written.
          </CardDescription>
        </CardHeader>
        <QuestionBankUploader
          topics={topics.map((t) => ({ id: t.id, name: t.name, gradeBand: t.gradeBand }))}
        />
      </Card>
    </main>
  );
}
