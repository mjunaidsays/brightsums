import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { SignupWizardStep2 } from "@/components/auth/signup-wizard";

export default async function SignupProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signup");

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, session.user.id));
  if (existing) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <SignupWizardStep2 />
    </main>
  );
}
