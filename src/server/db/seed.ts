import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import path from "node:path";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./client";
import { subjects, topics, schools, users, questions } from "./schema";
import { questionBankSchema } from "@/server/import/question-bank.schema";
import { validateQuestionBank } from "@/server/import/question-bank.importer";
import { commitAcceptedQuestions } from "@/server/import/question-bank.commit";

/** Fixed ID so re-running the seed script and local dev code can rely on it. */
export const TEST_STUDENT_BETTER_AUTH_ID = "seed-test-student";

/**
 * Seeds the real grade2_math_mcqs_v2_varied.json bank through the actual
 * importer path (not a shortcut) per the plan's Phase 1 requirement, so the
 * importer itself gets exercised from day one. Idempotent: safe to re-run.
 */
async function seed() {
  console.log("Seeding subjects...");
  let [mathSubject] = await db.select().from(subjects).where(eq(subjects.slug, "math"));
  if (!mathSubject) {
    [mathSubject] = await db
      .insert(subjects)
      .values({ slug: "math", name: "Mathematics" })
      .returning();
  }
  console.log(`  subject: ${mathSubject.id} (${mathSubject.slug})`);

  console.log("Seeding topic...");
  const topicName = "Repeated Addition & Multiplication";
  let [topic] = await db
    .select()
    .from(topics)
    .where(
      and(
        eq(topics.subjectId, mathSubject.id),
        eq(topics.gradeBand, "grade_2"),
        eq(topics.name, topicName)
      )
    );
  if (!topic) {
    [topic] = await db
      .insert(topics)
      .values({ subjectId: mathSubject.id, gradeBand: "grade_2", name: topicName })
      .returning();
  }
  console.log(`  topic: ${topic.id} (${topic.name})`);

  console.log("Loading grade2_math_mcqs_v2_varied.json...");
  const raw = readFileSync(
    path.resolve(process.cwd(), "grade2_math_mcqs_v2_varied.json"),
    "utf-8"
  );
  const bank = questionBankSchema.parse(JSON.parse(raw));

  console.log("Validating through the real importer...");
  const report = validateQuestionBank(bank.questions);
  console.log(`  accepted: ${report.accepted.length}, rejected: ${report.rejected.length}`);
  if (report.rejected.length > 0) {
    console.log("  rejected details:", report.rejected);
  }

  const [{ count: existingCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(eq(questions.topicId, topic.id));
  if (existingCount > 0) {
    console.log(`  skipping import — topic already has ${existingCount} questions.`);
  } else {
    console.log("Committing accepted questions...");
    const inserted = await commitAcceptedQuestions(
      topic.id,
      report.accepted,
      bank.title ?? "grade2_math_mcqs_v2_varied.json"
    );
    console.log(`  inserted ${inserted.length} questions.`);
  }

  console.log("Seeding test school + test student (Phase 1, pre-auth-gating)...");
  let [testSchool] = await db.select().from(schools).where(eq(schools.name, "Test Academy"));
  if (!testSchool) {
    [testSchool] = await db
      .insert(schools)
      .values({ name: "Test Academy", normalizedName: "test academy", city: "Lahore" })
      .returning();
  }
  let [testStudent] = await db
    .select()
    .from(users)
    .where(eq(users.betterAuthUserId, TEST_STUDENT_BETTER_AUTH_ID));
  if (!testStudent) {
    [testStudent] = await db
      .insert(users)
      .values({
        betterAuthUserId: TEST_STUDENT_BETTER_AUTH_ID,
        role: "student",
        fullName: "Test Student",
        age: 8,
        parentName: "Test Parent",
        parentPhone: "0300-0000000",
        gradeBand: "grade_2",
        schoolId: testSchool.id,
        city: "Lahore",
      })
      .returning();
  }
  console.log(`  test student: ${testStudent.id}`);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
