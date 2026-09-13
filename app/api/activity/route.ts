import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { recordActivity } from "@/lib/activity/record";
import type { ActivityEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Takes a batch of page views from one person's browser.
 *
 * Batched on purpose and it must stay that way — see `lib/activity/record.ts`.
 * The browser buffers views and posts them every half minute or when the tab
 * goes away, so a long study session costs a few writes rather than one per
 * page.
 *
 * The uid is taken from the session and the body's is ignored, because the
 * body is the one part of this a student controls. Times are clamped to a
 * window around now for the same reason: without that, a forged batch could
 * back-date itself into last month's record or claim next year.
 */
const MAX_EVENTS = 40;

/** A path, and nothing else. No query string, no fragment, no absolute URL. */
const pathSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^\/[A-Za-z0-9\-._~/]*$/, "path only");

const bodySchema = z.object({
  events: z
    .array(
      z.object({
        path: pathSchema,
        at: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(MAX_EVENTS),
});

/** How far from now a reported time may sit before it is pulled back to now. */
const DRIFT_MS = 6 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  // No session is not an error worth reporting: a beacon fired as the tab
  // closes can outlive the cookie, and the browser has nowhere to show a 401.
  if (!user) return new NextResponse(null, { status: 204 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const now = Date.now();
  const events: ActivityEvent[] = body.events.map((event) => ({
    kind: "page",
    path: event.path,
    // A phone with a wrong clock is common here; trusting it would file a
    // student's evening under a day that has not happened yet.
    at: Math.abs(event.at - now) > DRIFT_MS ? now : event.at,
  }));

  try {
    await recordActivity(user.uid, user.tenantId, events);
  } catch (err) {
    // Losing a page view must never surface to a student mid-navigation.
    console.error("[activity] batch rejected", err);
  }

  return new NextResponse(null, { status: 204 });
}
