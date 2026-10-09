import { NextResponse, type NextRequest } from "next/server";
import { buyerRoute } from "@/lib/exam-pack/guard";
import { isPaperId } from "@/lib/exam-pack/config";
import { startSitting } from "@/lib/exam-pack/sittings";
import { isStaff } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts or resumes a timed sitting. Returns the questions without their key,
 * and the server's own start time — the browser counts down from that, not
 * from when it happened to load.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await ctx.params;
  if (!isPaperId(paperId)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const gate = await buyerRoute();
  if (gate.response) return gate.response;

  const outcome = await startSitting({
    uid: gate.user.uid,
    tenantId: gate.user.tenantId,
    paperId,
    staff: isStaff(gate.user.role),
  });
  if (outcome.state === "submitted") {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 });
  }
  return NextResponse.json({ ...outcome.start, now: Date.now() });
}
