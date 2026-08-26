import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { startMockExam } from "@/lib/mockexams/engine";

export const runtime = "nodejs";

const bodySchema = z.object({ subjectId: z.string().min(1).max(64) });

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ mockExamId: string }> },
) {
  const { mockExamId } = await ctx.params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let subjectId: string;
  try {
    ({ subjectId } = bodySchema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
  }

  try {
    const result = await startMockExam({ uid: user.uid, tenantId: user.tenantId, subjectId, mockExamId });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "EXAM_NOT_FOUND") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (message === "ALREADY_SUBMITTED") return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    throw err;
  }
}
