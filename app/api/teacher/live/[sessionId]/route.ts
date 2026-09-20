import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { openQuiz, closeQuiz, clearQuiz, dismissHand } from "@/lib/live/arena";
import type { ClassSession, Question } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("open"),
    questionId: z.string().trim().min(1).max(128),
    durationSeconds: z.number().int().min(10).max(300).default(45),
  }),
  z.object({ action: z.literal("close") }),
  z.object({ action: z.literal("clear") }),
  z.object({ action: z.literal("dismiss_hand"), uid: z.string().trim().min(1).max(128) }),
]);

/**
 * The teacher's controls for the live room.
 *
 * Every write the design forbids a student from making lands here: `quiz`,
 * `leaderboard` and `stats` are `".write": false` in `database.rules.json`, so
 * the only way a question reaches a thousand screens — or a board is
 * published — is through a staff session on this route.
 *
 * Scoped to one session rather than being a general "write to RTDB" endpoint,
 * so a compromised staff account can disrupt a class and not the database.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isStaff(user.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { sessionId } = await ctx.params;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const snap = await col.sessions().doc(sessionId).get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const session = snap.data() as ClassSession;
  if (session.tenantId !== publicEnv.tenantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  switch (parsed.data.action) {
    case "open": {
      const questionSnap = await col.questions().doc(parsed.data.questionId).get();
      if (!questionSnap.exists) {
        return NextResponse.json({ error: "not_found", reason: "question" }, { status: 404 });
      }
      const question = questionSnap.data() as Question;
      // A question from another subject on this class's board would be a
      // confusing accident rather than an attack, and it is one line to stop.
      if (question.subjectId !== session.subjectId) {
        return NextResponse.json({ error: "bad_request", reason: "subject" }, { status: 400 });
      }
      const quiz = await openQuiz({
        sessionId,
        question,
        durationSeconds: parsed.data.durationSeconds,
      });
      return NextResponse.json({ quiz });
    }

    case "close": {
      const result = await closeQuiz({ sessionId, session });
      if (!result) return NextResponse.json({ error: "not_found", reason: "quiz" }, { status: 404 });
      return NextResponse.json(result);
    }

    case "clear":
      await clearQuiz(sessionId);
      return NextResponse.json({ ok: true });

    case "dismiss_hand":
      await dismissHand(sessionId, parsed.data.uid);
      return NextResponse.json({ ok: true });
  }
}
