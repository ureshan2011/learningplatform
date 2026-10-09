import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { buyerRoute, jsonBody } from "@/lib/exam-pack/guard";
import { isPaperId } from "@/lib/exam-pack/config";
import { getSittingResult, submitSitting } from "@/lib/exam-pack/sittings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ answers: z.record(z.string(), z.unknown()) });

/**
 * Marks and locks a sitting, and returns the full review: score, rank, topic
 * breakdown, and every question with its answer and walkthrough.
 *
 * A second submit — a double tap, a second tab — gets the locked result back
 * rather than an error, because from the student's side it is the same paper.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await ctx.params;
  if (!isPaperId(paperId)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const gate = await buyerRoute();
  if (gate.response) return gate.response;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  try {
    const result = await submitSitting({ uid: gate.user.uid, paperId, answers: parsed.data.answers });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "ALREADY_SUBMITTED") {
      const result = await getSittingResult(gate.user.uid, paperId);
      if (result) return NextResponse.json(result);
    }
    if (message === "NOT_STARTED") return NextResponse.json({ error: "not_started" }, { status: 409 });
    throw err;
  }
}
