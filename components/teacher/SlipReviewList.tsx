"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    return <p className="mt-3 text-sm text-white/50">No slips waiting.</p>;
  }

  return (
    <>
      <ul className="mt-3 space-y-3">
        {slips.map((slip) => (
          <li key={slip.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{slip.studentName}</p>
                <p className="mt-0.5 text-sm text-white/50">
                  {slip.subjectId} · {slip.amount} · {slip.submittedAt}
                </p>
                {slip.slipUrl ? (
                  <a
                    href={slip.slipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-[--color-accent] underline"
                  >
                    View slip
                  </a>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => review(slip.id, "approve")}
                  disabled={busyId === slip.id}
                  className="rounded-lg bg-[--color-success] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => review(slip.id, "reject")}
                  disabled={busyId === slip.id}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </>
  );
}
