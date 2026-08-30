"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Phase = "waiting" | "unlocked" | "failed" | "slow";

/** PayHere's notification normally lands within a second or two of the redirect. */
const POLL_MS = 2000;
const GIVE_UP_MS = 45_000;

/**
 * Watches one payment until the class actually opens.
 *
 * The page PayHere returns a student to proves nothing — it is a URL they could
 * type. Telling them "your class is being unlocked" and leaving it there is how
 * a student ends up refreshing a locked dashboard, deciding the money is gone,
 * and messaging at 10pm. So this asks the server, every couple of seconds,
 * whether the payment has actually landed, and says something honest and
 * specific whichever way it goes.
 */
export function PaymentStatusWatcher({ orderId }: { orderId: string }) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);
  // Set on the first poll rather than during render — reading the clock while
  // rendering is impure, and the deadline only has to start when polling does.
  const startedAt = useRef(0);

  const check = useCallback(async () => {
    if (startedAt.current === 0) startedAt.current = Date.now();
    try {
      const res = await fetch(`/api/payments/status?order=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        status: string;
        unlocked: boolean;
        subjectId?: string;
        receiptNo?: string | null;
      };

      if (data.unlocked || data.status === "paid") {
        setSubjectId(data.subjectId ?? null);
        setReceiptNo(data.receiptNo ?? null);
        setPhase("unlocked");
        return;
      }
      if (data.status === "failed" || data.status === "cancelled") {
        setPhase("failed");
        return;
      }
      if (Date.now() - startedAt.current > GIVE_UP_MS) setPhase("slow");
    } catch {
      // Offline for a moment; the next tick tries again.
    }
  }, [orderId]);

  useEffect(() => {
    if (phase !== "waiting") return;
    const first = window.setTimeout(check, 0);
    const timer = window.setInterval(check, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [check, phase]);

  if (phase === "unlocked") {
    return (
      <div className="rounded-xl border border-(--color-awaken-success)/30 bg-(--color-awaken-success-soft) p-5 text-sm">
        <p className="flex items-center justify-center gap-2 font-semibold text-(--color-awaken-success)">
          <Icon name="check_circle" className="!text-lg" />
          Your class is open
        </p>
        {receiptNo ? (
          <p className="mt-1 text-(--color-awaken-ink-soft)">Receipt {receiptNo}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={subjectId ? `/subjects/${subjectId}` : "/dashboard"}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3 font-semibold text-white"
          >
            <Icon name="school" className="!text-base" />
            Go to my class
          </Link>
          <Link href="/account" className="text-xs text-(--color-awaken-ink-soft) underline">
            See the receipt
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="rounded-xl border border-(--color-awaken-danger)/30 bg-(--color-awaken-danger-soft) p-5 text-sm">
        <p className="font-semibold text-(--color-awaken-danger)">That payment did not go through</p>
        <p className="mt-1 text-(--color-awaken-ink-soft)">
          Nothing was charged. Try again, or pay by bank deposit instead.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-(--color-awaken-deep) px-6 py-3 font-semibold text-white"
          >
            Back to dashboard
          </Link>
          <Link href="/pay/slip" className="text-xs text-(--color-awaken-ink-soft) underline">
            Pay by bank deposit
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "slow") {
    return (
      <div className="rounded-xl border border-(--color-awaken-warn)/40 bg-(--color-awaken-warn-soft) p-5 text-sm">
        <p className="font-semibold text-(--color-awaken-warn)">Still waiting on the bank</p>
        <p className="mt-1 text-(--color-awaken-ink-soft)">
          Your payment may still be on its way. Check your dashboard in a few minutes — if the class
          is still locked, send your teacher this reference and they can see exactly what happened:
        </p>
        <p className="mt-2 font-mono text-xs break-all">{orderId}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-(--color-awaken-deep) px-6 py-3 font-semibold text-white"
        >
          Go to my dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 text-sm">
      <p className="flex items-center justify-center gap-2 font-semibold">
        <span className="size-2 animate-ping rounded-full bg-(--color-awaken-accent)" />
        Confirming your payment…
      </p>
      <p className="mt-1 text-(--color-awaken-ink-soft)">
        This usually takes a few seconds. Keep this page open.
      </p>
    </div>
  );
}
