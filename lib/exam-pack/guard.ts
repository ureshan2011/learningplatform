import "server-only";

import { NextResponse } from "next/server";
import { getSessionUser, requireTeacher, type SessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { EXAM_PACK_ID } from "@/lib/exam-pack/config";

/**
 * The two gates every Exam Pack route stands behind, written once.
 *
 * `buyerRoute` is a thin wrapper over `hasAccess` — the single access check —
 * not a second rule beside it. A teacher passes because `hasAccess` says yes to
 * staff, which is what lets the owner rehearse every screen a buyer sees.
 */

export type Gate = { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse };

export async function buyerRoute(): Promise<Gate> {
  const user = await getSessionUser();
  if (!user) return { response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  const access = await hasAccess(user.uid, EXAM_PACK_ID);
  if (!access.allowed) {
    return { response: NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 }) };
  }
  return { user };
}

export async function teacherRoute(): Promise<Gate> {
  try {
    return { user: await requireTeacher() };
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return { response: NextResponse.json({ error: "not_permitted" }, { status }) };
  }
}

/** Reads a JSON body, or null if it is not JSON — so a route can answer 400 instead of throwing. */
export async function jsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
