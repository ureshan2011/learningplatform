import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { nextQuestionBatch } from "@/lib/practice/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;

/** Returns one practice batch — due reviews first, then weak-topic-biased new questions. */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ subjectId: string }> },
) {
  const { subjectId } = await ctx.params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
  }

  const questions = await nextQuestionBatch(user.uid, subjectId, BATCH_SIZE);
  return NextResponse.json({ questions });
}
