import "server-only";

import { adminDb, col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { colomboDateString } from "@/lib/format";
import type { Payment, PaymentStatus, Subject, User } from "@/lib/types";

/**
 * The books.
 *
 * One place that reads every payment, joins the student and subject names onto
 * it, and adds up the month — so the console, the CSV export and any future
 * report all agree on the same numbers. Two screens computing "this month's
 * income" separately is how a platform ends up with two different answers.
 */

/** Same reasoning as lib/teacher/insights.ts: single-field queries, narrowed in memory. */
const SCAN_WINDOW = 3000;

export interface LedgerRow {
  id: string;
  receiptNo: string;
  /** When the money moved (paid date), falling back to when the record was created. */
  at: number;
  dateLabel: string;
  studentName: string;
  studentPhone: string;
  subjectName: string;
  subjectId: string;
  method: string;
  status: PaymentStatus;
  amountLKR: number;
  periodStart: number;
  periodEnd: number;
  providerRef: string;
  bankRef: string;
  note: string;
  slipUrl: string;
  accessRevoked: boolean;
  uid: string;
}

export interface MonthTotal {
  /** "2026-08" in Colombo time. */
  month: string;
  label: string;
  collectedLKR: number;
  refundedLKR: number;
  netLKR: number;
  count: number;
}

export interface LedgerTotals {
  collectedThisMonthLKR: number;
  collectedLastMonthLKR: number;
  collectedAllTimeLKR: number;
  refundedAllTimeLKR: number;
  pendingLKR: number;
  pendingCount: number;
  paidCount: number;
  byMonth: MonthTotal[];
}

export interface Ledger {
  rows: LedgerRow[];
  totals: LedgerTotals;
}

/** How each payment reads in the books. */
export const METHOD_LABEL: Record<Payment["provider"], string> = {
  payhere: "Card (PayHere)",
  bank_slip: "Bank slip",
  manual: "Cash / direct",
};

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
  chargeback: "Chargeback",
  refunded: "Refunded",
};

function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, m - 1, 15)),
  );
}

/**
 * Every payment, newest first, with the totals an accountant asks for.
 *
 * Reads the whole payment collection rather than one page of it, deliberately:
 * the totals have to be right, and a total computed from a page is wrong. At a
 * few thousand payments a year this is one cheap query; past that, the month
 * totals move to a scheduled aggregate — the same note as everywhere else in
 * this codebase about when to stop scanning.
 */
export async function getLedger(subjects: Subject[]): Promise<Ledger> {
  const snap = await col.payments().orderBy("createdAt", "desc").limit(SCAN_WINDOW).get();

  const payments = snap.docs
    .map((d) => d.data() as Payment)
    .filter((p) => p.tenantId === publicEnv.tenantId);

  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  // One batched read for the students rather than a query per payment.
  const uids = [...new Set(payments.map((p) => p.uid))];
  const userSnaps = uids.length
    ? await adminDb().getAll(...uids.map((uid) => col.users().doc(uid)))
    : [];
  const userByUid = new Map(userSnaps.map((s) => [s.id, s.data() as User | undefined]));

  const rows: LedgerRow[] = payments.map((p) => {
    const at = p.paidAt ?? p.createdAt;
    const student = userByUid.get(p.uid);
    return {
      id: p.id,
      receiptNo: p.receiptNo ?? "",
      at,
      dateLabel: colomboDateString(at),
      studentName: student?.name ?? "Unknown student",
      studentPhone: student?.phone ?? "",
      subjectName: subjectById.get(p.subjectId)?.name ?? p.subjectId,
      subjectId: p.subjectId,
      method: METHOD_LABEL[p.provider] ?? p.provider,
      status: p.status,
      amountLKR: p.amountLKR,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      providerRef: p.providerRef ?? "",
      bankRef: p.bankRef ?? "",
      note: p.note ?? p.rejectionReason ?? p.refundReason ?? "",
      slipUrl: p.slipUrl ?? "",
      accessRevoked: Boolean(p.accessRevoked),
      uid: p.uid,
    };
  });

  return { rows, totals: totalsFor(rows) };
}

function totalsFor(rows: LedgerRow[]): LedgerTotals {
  const thisMonth = colomboDateString(Date.now()).slice(0, 7);
  const lastMonth = (() => {
    const [y, m] = thisMonth.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 2, 15));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  const byMonth = new Map<string, MonthTotal>();
  let collectedAllTimeLKR = 0;
  let refundedAllTimeLKR = 0;
  let pendingLKR = 0;
  let pendingCount = 0;
  let paidCount = 0;

  for (const row of rows) {
    const month = row.dateLabel.slice(0, 7);
    const bucket = byMonth.get(month) ?? {
      month,
      label: monthLabel(month),
      collectedLKR: 0,
      refundedLKR: 0,
      netLKR: 0,
      count: 0,
    };

    if (row.status === "paid") {
      collectedAllTimeLKR += row.amountLKR;
      paidCount += 1;
      bucket.collectedLKR += row.amountLKR;
      bucket.count += 1;
    } else if (row.status === "refunded" || row.status === "chargeback") {
      // Money that came in and went back out. Counted in both columns so the
      // month still shows what was banked, and the net shows what was kept.
      refundedAllTimeLKR += row.amountLKR;
      bucket.collectedLKR += row.amountLKR;
      bucket.refundedLKR += row.amountLKR;
      bucket.count += 1;
    } else if (row.status === "pending") {
      pendingLKR += row.amountLKR;
      pendingCount += 1;
    }

    bucket.netLKR = bucket.collectedLKR - bucket.refundedLKR;
    byMonth.set(month, bucket);
  }

  const months = [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));

  return {
    collectedThisMonthLKR: byMonth.get(thisMonth)?.netLKR ?? 0,
    collectedLastMonthLKR: byMonth.get(lastMonth)?.netLKR ?? 0,
    collectedAllTimeLKR,
    refundedAllTimeLKR,
    pendingLKR,
    pendingCount,
    paidCount,
    byMonth: months.slice(0, 13),
  };
}

/** Escapes one CSV field — quotes doubled, the whole thing quoted. */
function csvField(value: string | number): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * The ledger as a spreadsheet.
 *
 * Column order follows what a bookkeeper enters first: receipt, date, who,
 * what, how much. Opens directly in Excel, Google Sheets or LibreOffice, and
 * is the file to hand an accountant at year end.
 */
export function ledgerToCsv(rows: LedgerRow[]): string {
  const header = [
    "Receipt No",
    "Date",
    "Student",
    "Phone",
    "Subject",
    "Method",
    "Status",
    "Amount (LKR)",
    "Period start",
    "Period end",
    "Gateway reference",
    "Bank reference",
    "Access revoked",
    "Note",
  ];

  const lines = [header.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.receiptNo,
        row.dateLabel,
        row.studentName,
        row.studentPhone,
        row.subjectName,
        row.method,
        STATUS_LABEL[row.status] ?? row.status,
        row.amountLKR,
        colomboDateString(row.periodStart),
        colomboDateString(row.periodEnd),
        row.providerRef,
        row.bankRef,
        row.accessRevoked ? "yes" : "",
        row.note,
      ]
        .map(csvField)
        .join(","),
    );
  }

  return lines.join("\r\n");
}
