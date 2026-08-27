"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export interface PendingSlip {
  id: string;
  studentName: string;
  subjectId: string;
  amount: string;
  slipUrl: string;
  submittedAt: string;
}

/** Approve or reject bank deposit slips. Approving grants a month of access. */
export function SlipReviewList({ slips }: { slips: PendingSlip[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(paymentId: string, decision: "approve" | "reject") {
    setBusyId(paymentId);
    setError(null);
    try {
      const res = await fetch("/api/teacher/payments/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentId, decision, months: 1 }),
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
      <p className="mt-3 rounded-xl border border-dashed border-(--color-awaken-line) bg-(--color-awaken-card) p-5 text-sm text-(--color-awaken-ink-soft)">
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
            className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--color-awaken-indigo-soft) text-sm font-bold text-(--color-awaken-indigo)">
                  {slip.studentName.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{slip.studentName}</p>
                  <p className="mt-0.5 truncate text-sm text-(--color-awaken-ink-soft)">
                    {slip.subjectId} · {slip.submittedAt}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-lg font-bold text-(--color-awaken-accent)">{slip.amount}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-(--color-awaken-line) pt-3">
              {slip.slipUrl ? (
                <a
                  href={slip.slipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-(--color-awaken-deep) underline"
                >
                  <Icon name="link" className="!text-base" />
                  View slip
                </a>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => review(slip.id, "reject")}
                  disabled={busyId === slip.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-3 py-2 text-sm font-medium hover:border-(--color-awaken-danger)/40 hover:text-(--color-awaken-danger) disabled:opacity-50"
                >
                  <Icon name="cancel" className="!text-base" />
                  Reject
                </button>
                <button
                  onClick={() => review(slip.id, "approve")}
                  disabled={busyId === slip.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-(--color-awaken-success) px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Icon name="check_circle" className="!text-base" />
                  Approve
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </>
  );
}
