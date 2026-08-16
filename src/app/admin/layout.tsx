import { requireAdmin } from "@/server/auth/session";
import { AdminNav } from "@/components/dashboard/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <AdminNav />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
