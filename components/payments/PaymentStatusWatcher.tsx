"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink, Card } from "@/components/ds-cream";
import { track } from "@/lib/analytics";
import { fetchWithSession, signInHref } from "@/lib/auth/session-client";

type Phase = "waiting" | "unlocked" | "failed" | "slow" | "signin";

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
      const res = await fetchWithSession(`/api/payments/status?order=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        // `fetchWithSession` already tried the silent renewal once — a 401
        // that survives that is a session genuinely gone, not a blip. The
        // payment itself is unaffected (the PayHere notify handler unlocks it
        // regardless of this browser), so this only needs to get the student
        // back to a session, not resubmit anything.
        setPhase("signin");
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as {
        status: string;
        unlocked: boolean;
        subjectId?: string;
        receiptNo?: string | null;
        amountLKR?: number;
        provider?: string;
      };

      if (data.unlocked || data.status === "paid") {
        setSubjectId(data.subjectId ?? null);
        setReceiptNo(data.receiptNo ?? null);
        setPhase("unlocked");

        // sessionStorage, not a ref: a refresh of this same success page must
        // not count the same payment twice, and this page can be reloaded.
        const dedupeKey = `ga_purchase_${orderId}`;
        if (!window.sessionStorage.getItem(dedupeKey)) {
          window.sessionStorage.setItem(dedupeKey, "1");
          track("purchase", {
            transaction_id: orderId,
            value: data.amountLKR,
            currency: "LKR",
            payment_type: data.provider,
            items: [{ item_id: data.subjectId, item_name: data.subjectId }],
          });
        }
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
      <div className={clsx("rounded-ict-card border p-5 text-sm", "border-ict-green-500/30 bg-ict-green-50")}>
        <p className="flex items-center justify-center gap-2 font-semibold text-ict-green-500">
          <Icon name="check_circle" className="!text-lg" />
          Your class is open
        </p>
        {receiptNo ? (
          <p className="mt-1 text-center text-ict-ink-400">Receipt {receiptNo}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          <ButtonLink
            href={subjectId ? `/subjects/${subjectId}` : "/dashboard"}
            variant="primary"
            size="md"
            arrow="none"
            className="justify-center"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="school" className="!text-base" />
              Go to my class
            </span>
          </ButtonLink>
          <a href="/account" className="text-xs text-ict-ink-400 underline">
            See the receipt
          </a>
        </div>
      </div>
    );
  }

  if (phase === "signin") {
    return (
      <div className={clsx("rounded-ict-card border p-5 text-sm", "border-ict-paper-300 bg-ict-paper-0")}>
        <p className="font-semibold text-ict-ink-900">Sign in to see this payment</p>
        <p className="mt-1 text-ict-ink-400">
          Your sign-in lapsed while we were checking. Sign in again and this page will pick up right
          where it left off — nothing was lost.
        </p>
        <ButtonLink
          href={signInHref()}
          variant="primary"
          size="md"
          arrow="none"
          className="mt-4 justify-center"
        >
          Sign in
        </ButtonLink>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className={clsx("rounded-ict-card border p-5 text-sm", "border-ict-red-500/30 bg-ict-red-50")}>
        <p className="font-semibold text-ict-red-500">That payment did not go through</p>
        <p className="mt-1 text-ict-ink-400">
          Nothing was charged. Try again, or pay by bank deposit instead.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <ButtonLink href="/dashboard" variant="secondary" size="md" arrow="none" className="justify-center">
            Back to dashboard
          </ButtonLink>
          <a href="/pay/slip" className="text-xs text-ict-ink-400 underline">
            Pay by bank deposit
          </a>
        </div>
      </div>
    );
  }

  if (phase === "slow") {
    return (
      <div className={clsx("rounded-ict-card border p-5 text-sm", "border-ict-amber-500/40 bg-ict-amber-50")}>
        <p className="font-semibold text-[#a1670f]">Still waiting on the bank</p>
        <p className="mt-1 text-ict-ink-400">
          Your payment may still be on its way. Check your dashboard in a few minutes — if the class
          is still locked, send your teacher this reference and they can see exactly what happened:
        </p>
        <p className="mt-2 font-mono text-xs break-all text-ict-ink-900">{orderId}</p>
        <ButtonLink href="/dashboard" variant="secondary" size="md" arrow="none" className="mt-4 justify-center">
          Go to my dashboard
        </ButtonLink>
      </div>
    );
  }

  return (
    <Card radius="card" className="p-5 text-sm">
      <p className="flex items-center justify-center gap-2 font-semibold text-ict-ink-900">
        <span className="size-2 animate-ping rounded-full bg-ict-orange-500" />
        Confirming your payment…
      </p>
      <p className="mt-1 text-center text-ict-ink-400">
        This usually takes a few seconds. Keep this page open.
      </p>
    </Card>
  );
}
