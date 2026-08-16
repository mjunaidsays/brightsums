import { requireStudent } from "@/server/auth/session";
import { StudentNav } from "@/components/dashboard/student-nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <StudentNav fullName={user.fullName} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
