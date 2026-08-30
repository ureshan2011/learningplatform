import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth/session";
import { createMockExam } from "@/lib/mockexams/engine";

export const runtime = "nodejs";

const bodySchema = z.object({
  subjectId: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(140),
  durationMinutes: z.number().int().min(5).max(240),
  // Fraction deducted per wrong answer — real A/L MCQ papers use
  // negative marking, so a mock that doesn't only trains the easier game.
  negativeMarking: z.number().min(0).max(1).default(0),
  questionCount: z.number().int().min(1).max(200),
  topic: z.string().trim().min(1).max(140).optional(),
  year: z.number().int().min(1990).max(2100).optional(),
});

/**
 * Creates a mock exam: picks and freezes a question snapshot so every
 * student who sits it gets the identical paper. See `createMockExam` for why
 * that snapshot matters.
 */
export async function POST(req: NextRequest) {
  let tenantId: string, uid: string;
  try {
    ({ tenantId, uid } = await requireTeacher());
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const exam = await createMockExam({
      tenantId,
      subjectId: body.subjectId,
      title: body.title,
      durationMinutes: body.durationMinutes,
      negativeMarking: body.negativeMarking,
      questionCount: body.questionCount,
      createdBy: uid,
      topic: body.topic,
      year: body.year,
    });
    return NextResponse.json({ ok: true, mockExam: exam });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_ENOUGH_QUESTIONS") {
      const available = (err as Error & { available?: number }).available ?? 0;
      return NextResponse.json({ error: "not_enough_questions", available }, { status: 409 });
    }
    throw err;
  }
}
