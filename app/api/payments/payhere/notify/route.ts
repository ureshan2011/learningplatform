import { NextResponse, type NextRequest } from "next/server";
import { processPayHereNotification } from "@/lib/payments/payhere-notify";

export const runtime = "nodejs";
// Payment state must never be served from a cache.
export const dynamic = "force-dynamic";

/**
 * PayHere server-to-server notification.
 *
 * This is the ONLY place an enrollment becomes active from a card payment.
 * The browser's return_url is cosmetic — a student can navigate to it directly,
 * so it must never grant anything.
 *
 * The decision itself lives in `processPayHereNotification`, shared with the
 * sandbox simulator so both go through the same signature check and the same
 * ledger writes. This handler is only the HTTP shell around it.
 *
 * PayHere retries on non-2xx, so every path returns 200 once the notification
 * has been handled — except a bad signature, where retrying only repeats the
 * same refusal.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const raw = Object.fromEntries(
    [...form.entries()].map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>;

  const { status, body } = await processPayHereNotification(raw);
  return NextResponse.json(body, { status });
}
