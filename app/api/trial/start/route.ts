import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { startFreeTrial } from "@/lib/payments/entitlements";
import type { Subject } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({ subjectId: z.string().min(1).max(64) });

/**
 * Starts the one-time, no-payment trial advertised on the landing page.
 *
 * `startFreeTrial` itself refuses a second grant (any existing enrollment
 * document — active, expired, or otherwise — blocks it), so this route just
 * validates the subject and surfaces that refusal as a normal JSON error
 * rather than a 500.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let subjectId: string;
  try {
    ({ subjectId } = bodySchema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const subjectSnap = await col.subjects().doc(subjectId).get();
  if (!subjectSnap.exists) {
    return NextResponse.json({ error: "subject_not_found" }, { status: 404 });
  }
  const subject = subjectSnap.data() as Subject;
  if (!subject.active) {
    return NextResponse.json({ error: "subject_inactive" }, { status: 409 });
  }

  try {
    await startFreeTrial({ uid: user.uid, subjectId, tenantId: user.tenantId });
  } catch (err) {
    const reason = err instanceof Error && "reason" in err ? (err as { reason?: string }).reason : undefined;
    if (reason === "trial_already_used") {
      return NextResponse.json({ error: "trial_already_used" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
