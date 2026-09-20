import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { savePushToken, removePushToken } from "@/lib/push/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ token: z.string().trim().min(16).max(512) });

/**
 * Records the browser a student wants class reminders on.
 *
 * Only the server writes this — the token lands on the user document, which is
 * the same document access and roles are read from, and a client that could
 * write there could write more than a token (CLAUDE.md, rule 5).
 *
 * A token is not a credential and not a secret: it identifies a browser to
 * Cloud Messaging and is useless without this project's service account. It
 * is still bound to the session's own uid rather than taken from the body, so
 * one student cannot subscribe another to their classes.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await savePushToken(user.uid, parsed.data.token);
  return NextResponse.json({ ok: true });
}

/** Turning reminders off, from the same screen that turned them on. */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await removePushToken(user.uid, parsed.data.token);
  return NextResponse.json({ ok: true });
}
