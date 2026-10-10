import "server-only";

import { redirect } from "next/navigation";
import { requirePageUser, type SessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { EXAM_PACK } from "@/lib/exam-pack/config";
import type { AccessResult } from "@/lib/types";

/**
 * For the Exam Pack's inner pages — a paper, the consultation, a print copy.
 *
 * Signed out goes to sign-in and back here (`requirePageUser`). Signed in
 * without the pack goes to the pack's own page, which is where it is sold,
 * rather than to a dead end. Access itself is decided by `hasAccess` — this
 * only chooses where to send someone who does not have it.
 */
export async function requireExamPackPage(path: string): Promise<{ user: SessionUser; access: AccessResult }> {
  const user = await requirePageUser(path);
  const access = await hasAccess(user.uid, EXAM_PACK.id);
  if (!access.allowed) redirect(EXAM_PACK.appPath);
  return { user, access };
}
