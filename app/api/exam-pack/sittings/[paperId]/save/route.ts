import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { buyerRoute, jsonBody } from "@/lib/exam-pack/guard";
import { isPaperId } from "@/lib/exam-pack/config";
import { saveSittingAnswers } from "@/lib/exam-pack/sittings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ answers: z.record(z.string(), z.unknown()) });

/**
 * Autosaves the answers so far. The paper screen calls this a few seconds after
 * each change, and when the tab is hidden. Refused once the time is up, so what
 * is saved is always what was answered inside the paper's time.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await ctx.params;
  if (!isPaperId(paperId)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const gate = await buyerRoute();
  if (gate.response) return gate.response;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const result = await saveSittingAnswers({ uid: gate.user.uid, paperId, answers: parsed.data.answers });
  return NextResponse.json({ ok: result === "saved", state: result });
}
