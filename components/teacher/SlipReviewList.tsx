"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/StatusBanner";

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
    return <p className="mt-3 text-sm text-(--color-text-faint)">No slips waiting.</p>;
  }

  return (
    <>
      <ul className="mt-3 space-y-3">
        {slips.map((slip) => (
          <li key={slip.id} className="surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{slip.studentName}</p>
                <p className="mt-0.5 text-sm text-(--color-text-muted)">
                  {slip.subjectId} · {slip.amount} · {slip.submittedAt}
                </p>
                {slip.slipUrl ? (
                  <a
                    href={slip.slipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-(--color-accent) underline"
                  >
                    View slip
                  </a>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => review(slip.id, "approve")}
                  disabled={busyId === slip.id}
                  className="btn btn-success btn-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => review(slip.id, "reject")}
                  disabled={busyId === slip.id}
                  className="btn btn-secondary btn-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {error ? (
        <div className="mt-2">
          <StatusBanner tone="error">{error}</StatusBanner>
        </div>
      ) : null}
    </>
  );
}
