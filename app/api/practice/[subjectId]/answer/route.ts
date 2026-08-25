import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { recordAnswer } from "@/lib/practice/engine";

export const runtime = "nodejs";

const bodySchema = z.object({
  questionId: z.string().min(1).max(128),
  choiceIndex: z.number().int().min(0).max(9),
});

/**
 * Scores one answer server-side and returns the explanation.
 *
 * Never trust a client-computed "correct" — the correct index and the
 * misconception note live only in this response, minted per submission, the
 * same reasoning `DownloadButton` uses for content URLs.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ subjectId: string }> },
) {
  const { subjectId } = await ctx.params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await recordAnswer({
      uid: user.uid,
      tenantId: user.tenantId,
      subjectId,
      questionId: body.questionId,
      choiceIndex: body.choiceIndex,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "QUESTION_NOT_FOUND") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw err;
  }
}
