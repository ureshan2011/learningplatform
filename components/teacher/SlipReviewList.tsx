"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { fetchWithSession } from "@/lib/auth/session-client";

export interface PendingSlip {
  id: string;
  studentName: string;
  studentPhone: string;
  subjectName: string;
  amountLKR: number;
  amount: string;
  slipUrl: string;
  submittedAt: string;
}

/**
 * Approve or reject bank deposit slips. Approving grants a month of access and
 * issues a receipt number.
 *
 * The amount is editable before approving, and that matters more than it
 * looks: the slip is created against the list price, but what the student
 * actually deposited is what the bank statement will say. Approving a
 * Rs 2,000 deposit as Rs 2,500 puts a number in the books that no statement
 * will ever match.
 */
export function SlipReviewList({ slips }: { slips: PendingSlip[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(slips.map((s) => [s.id, s.amountLKR])),
  );
  const [refs, setRefs] = useState<Record<string, string>>({});

  async function review(paymentId: string, decision: "approve" | "reject") {
    setBusyId(paymentId);
    setError(null);
    try {
      const res = await fetchWithSession("/api/teacher/payments/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentId,
          decision,
          months: 1,
          amountLKR: amounts[paymentId],
          bankRef: refs[paymentId] ?? "",
        }),
      });
      if (!res.ok) throw new Error("Could not save that decision.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (slips.length === 0) {
    return (
      <p className="mt-3 rounded-ict-md border border-dashed border-ict-line bg-ict-surface-card p-5 text-sm text-ict-fg-soft">
        No slips waiting.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-3 space-y-3">
        {slips.map((slip) => (
          <li
            key={slip.id}
            className="rounded-ict-md border border-ict-line bg-ict-surface-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ict-surface-sunken text-sm font-bold text-ict-fg-soft">
                  {slip.studentName.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{slip.studentName}</p>
                  <p className="mt-0.5 truncate text-sm text-ict-fg-soft">
                    {slip.subjectName} · {slip.submittedAt}
                    {slip.studentPhone ? ` · ${slip.studentPhone}` : ""}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-lg font-bold text-ict-accent-fg">{slip.amount}</p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ict-fg-soft">
                  Amount actually deposited (Rs)
                </span>
                <input
                  type="number"
                  min={0}
                  value={amounts[slip.id] ?? slip.amountLKR}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [slip.id]: Number(e.target.value) }))
                  }
                  className="w-full rounded-full border border-ict-line bg-ict-surface-card px-3 py-2 text-sm outline-none focus:border-ict-orange-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ict-fg-soft">
                  Deposit reference on the slip
                </span>
                <input
                  value={refs[slip.id] ?? ""}
                  onChange={(e) => setRefs((prev) => ({ ...prev, [slip.id]: e.target.value }))}
                  placeholder="Optional"
                  maxLength={120}
                  className="w-full rounded-full border border-ict-line bg-ict-surface-card px-3 py-2 text-sm outline-none focus:border-ict-orange-500"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-ict-line pt-3">
              {slip.slipUrl ? (
                <a
                  href={slip.slipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-ict-accent-fg underline"
                >
                  <Icon name="image" className="!text-base" />
                  View slip
                </a>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => review(slip.id, "reject")}
                  disabled={busyId === slip.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ict-line px-3 py-2 text-sm font-medium hover:border-ict-red-500/40 hover:text-ict-danger-fg disabled:opacity-50"
                >
                  <Icon name="cancel" className="!text-base" />
                  Reject
                </button>
                <button
                  onClick={() => review(slip.id, "approve")}
                  disabled={busyId === slip.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ict-green-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Icon name="check_circle" className="!text-base" />
                  Approve &amp; unlock
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-sm text-ict-danger-fg">{error}</p> : null}
    </>
  );
}
