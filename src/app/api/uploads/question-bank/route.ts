import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { questionBankSchema } from "@/server/import/question-bank.schema";
import { validateQuestionBank } from "@/server/import/question-bank.importer";
import { parseQuestionBankCsv } from "@/server/import/csv-importer";
import { commitAcceptedQuestions } from "@/server/import/question-bank.commit";
import { getOrCreateTopic, getDefaultSubject } from "@/server/db/queries/topics.queries";
import { GRADE_BANDS } from "@/lib/constants";

const bodySchema = z.object({
  fileContent: z.string().min(1),
  fileType: z.enum(["json", "csv"]),
  gradeBand: z.enum(GRADE_BANDS),
  topicId: z.uuid().optional(),
  newTopicName: z.string().trim().min(2).optional(),
  mode: z.enum(["validate", "commit"]),
  sourceLabel: z.string().optional(),
});

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (!input.topicId && !input.newTopicName) {
    return NextResponse.json(
      { error: "Provide either an existing topicId or a newTopicName." },
      { status: 400 }
    );
  }

  let sourceQuestions;
  try {
    if (input.fileType === "json") {
      const bank = questionBankSchema.parse(JSON.parse(input.fileContent));
      sourceQuestions = bank.questions;
    } else {
      sourceQuestions = parseQuestionBankCsv(input.fileContent);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not parse the uploaded file.";
    return NextResponse.json({ error: `File parsing failed: ${message}` }, { status: 400 });
  }

  const report = validateQuestionBank(sourceQuestions);

  if (input.mode === "validate") {
    return NextResponse.json({
      accepted: report.accepted.length,
      rejected: report.rejected,
      totalRows: sourceQuestions.length,
    });
  }

  // commit: resolve/create the topic, then write only the accepted rows
  let topicId = input.topicId;
  if (!topicId) {
    const subject = await getDefaultSubject();
    if (!subject) {
      return NextResponse.json({ error: "No subject configured (expected 'math')." }, { status: 500 });
    }
    const topic = await getOrCreateTopic({
      subjectId: subject.id,
      gradeBand: input.gradeBand,
      name: input.newTopicName!,
    });
    topicId = topic.id;
  }

  const inserted = await commitAcceptedQuestions(
    topicId,
    report.accepted,
    input.sourceLabel ?? "admin-upload",
    admin.id
  );

  return NextResponse.json({
    inserted: inserted.length,
    rejected: report.rejected,
    topicId,
  });
}
