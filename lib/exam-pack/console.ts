import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { EXAM_PACK_ID, EXAM_PACK_SLOTS, PAPER_IDS } from "@/lib/exam-pack/config";
import { countSubmitted } from "@/lib/exam-pack/sittings";
import { listContent } from "@/lib/queries";
import type { Enrollment, Payment } from "@/lib/types";

/**
 * The numbers on the Exam Pack console. English only, like the rest of the
 * console, and read independently so one failing query blanks its own panel
 * rather than the page.
 *
 * Single-equality queries narrowed in memory — the rule at the top of
 * lib/queries.ts, because this platform cannot deploy a composite index.
 */
export async function examPackSales(now = Date.now()): Promise<{
  activeBuyers: number;
  activeBuyerUids: string[];
  paidCount: number;
  revenueLKR: number;
}> {
  const [enrollSnap, paySnap, staffSnap] = await Promise.all([
    col.enrollments().where("subjectId", "==", EXAM_PACK_ID).limit(2000).get(),
    col.payments().where("subjectId", "==", EXAM_PACK_ID).limit(2000).get(),
    col.users().where("role", "in", ["teacher", "admin"]).limit(50).get(),
  ]);
  // Test accounts and the owner's own sandbox purchase are rehearsals, not
  // customers — counting them would show sales before anything was sold.
  const staff = new Set(staffSnap.docs.map((d) => d.id));
  const active = enrollSnap.docs
    .map((d) => d.data() as Enrollment)
    .filter(
      (e) =>
        e.tenantId === publicEnv.tenantId &&
        e.status === "active" &&
        e.currentPeriodEnd > now &&
        e.source !== "test" &&
        !staff.has(e.uid),
    );
  const paid = paySnap.docs
    .map((d) => d.data() as Payment)
    .filter((p) => p.tenantId === publicEnv.tenantId && p.status === "paid" && !staff.has(p.uid));
  return {
    activeBuyers: active.length,
    activeBuyerUids: active.map((e) => e.uid),
    paidCount: paid.length,
    revenueLKR: paid.reduce((sum, p) => sum + p.amountLKR, 0),
  };
}

/** Which of Dr. Yasas's file slots have a file in them. */
export async function filledSlots(): Promise<Set<string>> {
  const items = await listContent(EXAM_PACK_ID);
  return new Set(
    items
      .filter((i) => i.kind === "pack" && i.slug && EXAM_PACK_SLOTS.some((s) => s.key === i.slug))
      .map((i) => i.slug as string),
  );
}

/** How many students have submitted each paper. */
export async function sittingCounts(): Promise<Record<string, number>> {
  const entries = await Promise.all(PAPER_IDS.map(async (id) => [id, await countSubmitted(id)] as const));
  return Object.fromEntries(entries);
}
