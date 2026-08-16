import { eq } from "drizzle-orm";
import { requireStudent } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { schools } from "@/server/db/schema";
import { getLatestDocumentVerification } from "@/server/db/queries/documents.queries";
import { GRADE_BAND_LABELS } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EditProfileForm } from "@/components/dashboard/edit-profile-form";
import { DocumentUploadWidget } from "@/components/dashboard/document-upload-widget";
import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";

export default async function ProfilePage() {
  const user = await requireStudent();
  const [session, [school], latestDoc] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.select().from(schools).where(eq(schools.id, user.schoolId)),
    getLatestDocumentVerification(user.id),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Email</dt>
            <dd className="font-bold">{session?.user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">Grade</dt>
            <dd className="font-bold">{GRADE_BAND_LABELS[user.gradeBand as keyof typeof GRADE_BAND_LABELS]}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted-foreground">School</dt>
            <dd className="font-bold">{school?.name}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <CardDescription>
            Upload a school ID card or enrollment letter (JPEG, PNG, or PDF, up to 10MB).
          </CardDescription>
        </CardHeader>
        <DocumentUploadWidget
          status={user.documentVerificationStatus}
          fileName={latestDoc?.fileName}
          documentId={latestDoc?.id}
          rejectionReason={latestDoc?.rejectionReason}
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <EditProfileForm user={user} />
      </Card>
    </main>
  );
}
