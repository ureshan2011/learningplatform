import "server-only";

import { NextResponse } from "next/server";
import { getSessionUser, isStaff, requireTeacher, type SessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { EXAM_PACK_ID } from "@/lib/exam-pack/config";
import type { AccessResult } from "@/lib/types";

/**
 * The two gates every Exam Pack route stands behind, written once.
 *
 * `buyerRoute` is a thin wrapper over `hasAccess` — the single access check —
 * not a second rule beside it. A teacher passes because `hasAccess` says yes to
 * staff, which is what lets the owner rehearse every screen a buyer sees.
 */

export type Gate = { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse };

export type BuyerGate =
  | { user: SessionUser; access: AccessResult; response?: undefined }
  | { user?: undefined; access?: undefined; response: NextResponse };

export async function buyerRoute(): Promise<BuyerGate> {
  const user = await getSessionUser();
  if (!user) return { response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  const access = await hasAccess(user.uid, EXAM_PACK_ID);
  if (!access.allowed) {
    return { response: NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 }) };
  }
  return { user, access };
}

/**
 * Someone whose activity must not count as a real student's: staff, and the
 * owner's test accounts. Their sittings are never ranked against students.
 */
export function isRehearsal(user: SessionUser, access: AccessResult): boolean {
  return isStaff(user.role) || access.enrollment?.source === "test";
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
