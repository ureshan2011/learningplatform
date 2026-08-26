import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { submitMockExam } from "@/lib/mockexams/engine";

export const runtime = "nodejs";

const bodySchema = z.object({
  subjectId: z.string().min(1).max(64),
  // questionId -> chosen option index. A record, not an array, because the
  // client's question order is shuffled per student — see `questionOrder`.
  answers: z.record(z.string(), z.number().int().min(0).max(9)),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ mockExamId: string }> },
) {
  const { mockExamId } = await ctx.params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const access = await hasAccess(user.uid, body.subjectId);
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
  }

  try {
    const result = await submitMockExam({
      uid: user.uid,
      tenantId: user.tenantId,
      subjectId: body.subjectId,
      mockExamId,
      answers: body.answers,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "EXAM_NOT_FOUND") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (message === "NOT_STARTED") return NextResponse.json({ error: "not_started" }, { status: 409 });
    if (message === "ALREADY_SUBMITTED") return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    if (message === "TIME_EXPIRED") return NextResponse.json({ error: "time_expired" }, { status: 409 });
    throw err;
  }
}
