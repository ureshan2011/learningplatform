import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { teacherRoute } from "@/lib/exam-pack/guard";
import { GOOGLE_STATE_COOKIE, getGoogleSettings, resolveClient } from "@/lib/google/settings";
import { publicEnv } from "@/lib/env";
import { authorizationUrl } from "@/lib/google/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Connect Google" — sends the owner to Google's consent page.
 *
 * A plain link the console renders, so this is a GET navigation carrying the
 * session cookie. The `state` value is random, kept in a short-lived httpOnly
 * cookie, and checked on the way back: without it, someone could send the
 * owner a link that connects *their* Google account to the platform.
 */
export async function GET() {
  const gate = await teacherRoute();
  if (gate.response) return NextResponse.redirect(new URL("/teacher", publicEnv.appUrl));

  const client = resolveClient(await getGoogleSettings());
  if (!client) return NextResponse.redirect(new URL("/teacher/exam-pack?google=no_client", publicEnv.appUrl));

  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(authorizationUrl(client, state));
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/teacher/google",
    maxAge: 600,
  });
  return res;
}
