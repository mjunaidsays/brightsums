import { notFound } from "next/navigation";
import { getStudentDetail } from "@/server/db/queries/admin-users.queries";
import { getPaginatedAttempts } from "@/server/db/queries/attempts.queries";
import { getMyRank } from "@/server/db/queries/leaderboard.queries";
import { getLatestDocumentVerification } from "@/server/db/queries/documents.queries";
import { GRADE_BAND_LABELS, type GradeBand } from "@/lib/constants";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AttemptsTable } from "@/components/dashboard/attempts-table";
import { DocumentReviewPanel } from "@/components/admin/document-review-panel";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const student = await getStudentDetail(userId);
  if (!student) notFound();

  const [practiceAttempts, contestAttempts, rank, latestDoc] = await Promise.all([
    getPaginatedAttempts(userId, "practice", 1),
    getPaginatedAttempts(userId, "contest", 1),
    getMyRank({ userId, gradeBand: student.gradeBand as GradeBand }),
    getLatestDocumentVerification(userId),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">{student.fullName}</h1>

      <Card>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Email</dt>
            <dd className="font-bold">{student.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Grade</dt>
            <dd className="font-bold">
              {GRADE_BAND_LABELS[student.gradeBand as keyof typeof GRADE_BAND_LABELS]}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">School</dt>
            <dd className="font-bold">{student.schoolName}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Parent / Guardian</dt>
            <dd className="font-bold">
              {student.parentName} · {student.parentPhone}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Contest Rank</dt>
            <dd className="font-bold text-primary-600">{rank.rank ?? "Not ranked yet"}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Document Verification</dt>
            <dd className="font-bold capitalize">
              {student.documentVerificationStatus.replace("_", " ")}
            </dd>
          </div>
        </dl>
      </Card>

      {latestDoc && latestDoc.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Document Verification Review</CardTitle>
          </CardHeader>
          <DocumentReviewPanel
            documentId={latestDoc.id}
            studentUserId={userId}
            fileName={latestDoc.fileName}
          />
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contest Attempts</CardTitle>
        </CardHeader>
        <AttemptsTable attempts={contestAttempts.rows} emptyLabel="Not Attempted Yet" emptyIcon="🏆" />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice Attempts</CardTitle>
        </CardHeader>
        <AttemptsTable attempts={practiceAttempts.rows} emptyLabel="Not Attempted Yet" emptyIcon="✏️" />
      </Card>
    </main>
  );
}
