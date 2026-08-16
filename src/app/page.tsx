import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="rounded-[var(--radius-pill)] bg-tertiary-200 px-4 py-1.5 text-sm font-bold text-amber-700">
            🎉 Grade 1–10 · O/A-Levels · Pakistan
          </span>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-primary-600 sm:text-6xl">
            BrightSums
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Fun, fast, timed math quizzes and contests. Answer, learn why, and
            climb the Champions Board — all in 60 seconds a question.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" variant="default" render={<Link href="/signup" />}>
            Sign Up Free
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Log In
          </Button>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">⏱️</span>
              <p className="font-display font-bold">60-Second Rounds</p>
              <p className="text-sm text-muted-foreground">
                10 questions, 100 points, a countdown that keeps you on your toes.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">🧠</span>
              <p className="font-display font-bold">Learn the Why</p>
              <p className="text-sm text-muted-foreground">
                Every question comes with a friendly explanation, not just a score.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">🏆</span>
              <p className="font-display font-bold">Champions Board</p>
              <p className="text-sm text-muted-foreground">
                Compete by grade and school in timed contest rounds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
