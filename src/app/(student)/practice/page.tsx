import { requireStudent } from "@/server/auth/session";
import { getPlayableTopicsForGrade } from "@/server/db/queries/topics.queries";
import { getPaginatedAttempts } from "@/server/db/queries/attempts.queries";
import { GRADE_BAND_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { PracticeStartDialog } from "@/components/quiz/practice-start-dialog";
import { AttemptsTable, SeeAllLink } from "@/components/dashboard/attempts-table";

const BENEFITS = [
  { icon: "🎯", title: "Sharpen Your Skills", body: "Practice as many topics as you like — no limits, no pressure." },
  { icon: "🔁", title: "Practice Anytime", body: "Come back whenever you want and pick up right where you left off." },
  { icon: "📈", title: "Track Your Progress", body: "Every attempt is saved so you can watch your scores climb over time." },
];

export default async function PracticePage() {
  const user = await requireStudent();
  const [topics, history] = await Promise.all([
    getPlayableTopicsForGrade(user.gradeBand),
    getPaginatedAttempts(user.id, "practice", 1),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-3xl font-extrabold">Practice</h1>
        <p className="font-bold text-muted-foreground">{GRADE_BAND_LABELS[user.gradeBand]}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {BENEFITS.map((b) => (
          <Card key={b.title} className="items-center gap-1.5 text-center">
            <span className="text-3xl">{b.icon}</span>
            <p className="font-display font-bold">{b.title}</p>
            <p className="text-sm text-muted-foreground">{b.body}</p>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        {topics.length === 0 ? (
          <Card className="items-center gap-2 py-10 text-center">
            <span className="text-3xl">🚧</span>
            <p className="font-bold text-muted-foreground">
              No practice topics are ready for your grade yet — check back soon!
            </p>
          </Card>
        ) : (
          <PracticeStartDialog topics={topics} />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Your Practice History</h2>
          <SeeAllLink href="/practice/history" />
        </div>
        <Card>
          <AttemptsTable
            attempts={history.rows.map((a) => ({ ...a, id: a.id }))}
            emptyLabel="Not Attempted Yet"
            emptyIcon="✏️"
          />
        </Card>
      </div>
    </main>
  );
}
