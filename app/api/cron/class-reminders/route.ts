import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendClassReminders } from "@/lib/push/reminders";
import { pushConfigured } from "@/lib/features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends the "your class starts in 15 minutes" reminders.
 *
 * App Hosting has no cron of its own, so something outside has to call this —
 * Cloud Scheduler, in the same Google Cloud project, every five minutes. That
 * is one setup step in a browser console, documented in `docs/services.md`,
 * and until it exists this route simply never runs: no reminders, no errors,
 * nothing else affected. Same posture as every other optional service.
 *
 * ## Why a shared secret and not a session
 *
 * The caller is a machine, so there is no session to check. `CRON_SECRET` is
 * compared in constant time — a plain `===` on a secret leaks its length and
 * then its prefix to anyone willing to time the responses, and this endpoint
 * is the one that can notify every student on the platform.
 *
 * Refuses outright when the secret is unset rather than running open. An
 * endpoint that anyone can trigger is an endpoint that anyone can use to spend
 * the reminder window on an empty run and leave the real class unnotified,
 * because `remindedAt` will already be claimed.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const offered = req.headers.get("x-cron-secret") ?? "";
  if (!safeEqual(offered, secret)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!pushConfigured()) {
    return NextResponse.json({ error: "not_configured", reason: "push" }, { status: 503 });
  }

  const run = await sendClassReminders();
  return NextResponse.json(run);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // `timingSafeEqual` throws on a length mismatch, which would itself be a
  // timing signal, so the lengths are compared first and the comparison is
  // still run to keep the work constant.
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
