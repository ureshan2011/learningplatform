import { NextResponse } from "next/server";
import { buyerRoute } from "@/lib/exam-pack/guard";
import { getExamPackSettings } from "@/lib/exam-pack/settings";
import { joinLive } from "@/lib/exam-pack/lives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The Saturday live's Google Meet link, for a pack holder, inside the join
 * window. The link is never put in a page a non-buyer could load, and next week
 * there is a new one — so a link forwarded to a group chat stops working.
 */
export async function POST() {
  const gate = await buyerRoute();
  if (gate.response) return gate.response;

  const settings = await getExamPackSettings();
  const outcome = await joinLive({ settings, uid: gate.user.uid, name: gate.user.name });
  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.reason, ...(outcome.opensAt ? { opensAt: outcome.opensAt } : {}) },
      { status: 409 },
    );
  }
  return NextResponse.json({ url: outcome.url });
}
