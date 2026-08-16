import Link from "next/link";
import { getAdminOverview } from "@/server/db/queries/admin.queries";
import { Card } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const stats = await getAdminOverview();

  const cards = [
    { label: "Active Questions", value: stats.questionCount, icon: "❓", href: "/admin/questions" },
    { label: "Students", value: stats.studentCount, icon: "🎓", href: "/admin/users" },
    { label: "Open Contest Rounds", value: stats.openRoundCount, icon: "🏆", href: "/admin/contests" },
    {
      label: "Pending Document Reviews",
      value: stats.pendingDocCount,
      icon: "📄",
      href: "/admin/users",
    },
  ];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-extrabold">Admin Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="gap-2">
              <span className="text-3xl">{c.icon}</span>
              <span className="font-display text-3xl font-extrabold">{c.value}</span>
              <span className="font-bold text-muted-foreground">{c.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
