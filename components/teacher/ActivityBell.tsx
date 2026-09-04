"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { TeacherActivity } from "@/lib/payments/activity";
import { fetchWithSession } from "@/lib/auth/session-client";

/** Slow enough to be free, fast enough that a payment shows up while you watch. */
const POLL_MS = 20_000;

/**
 * Live notice of money arriving, while the console is open.
 *
 * A teacher testing a payment in another browser needs to see it land without
 * hunting for a refresh button, and a slip uploaded during class needs to
 * announce itself. Polling a small purpose-built collection every twenty
 * seconds is the cheap way to do that: no realtime connection to keep open, no
 * re-reading the whole ledger, and it works from the session cookie so it
 * cannot break when a browser has no Firebase auth state of its own.
 */
export function ActivityBell() {
  const router = useRouter();
  const [items, setItems] = useState<TeacherActivity[]>([]);
  const [unseen, setUnseen] = useState(0);
  const [open, setOpen] = useState(false);
  const lastSeenTop = useRef<number>(0);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithSession("/api/teacher/activity", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { activity: TeacherActivity[]; unseen: number };
      setItems(data.activity);
      setUnseen(data.unseen);

      // Something new arrived while the page was open — pull the server
      // components (ledger, totals, pending slips) back into step.
      const top = data.activity[0]?.at ?? 0;
      if (lastSeenTop.current && top > lastSeenTop.current) router.refresh();
      lastSeenTop.current = top;
    } catch {
      // Offline or signed out: the next tick tries again.
    }
  }, [router]);

  useEffect(() => {
    // Scheduled rather than called straight from the effect body: the first
    // fetch is a subscription starting, not state being set during render.
    const first = window.setTimeout(load, 0);
    const timer = window.setInterval(load, POLL_MS);
    // A teacher who tabs away to make a test payment comes back to fresh state.
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unseen > 0) {
      setUnseen(0);
      await fetchWithSession("/api/teacher/activity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ upTo: Date.now() }),
      }).catch(() => {});
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="relative inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm font-medium hover:border-(--color-awaken-accent)/40"
      >
        <Icon name="notifications_active" className="!text-base" />
        Activity
        {unseen > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-(--color-awaken-accent) px-1 text-[11px] font-bold text-white">
            {unseen}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-[min(22rem,80vw)] rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
          {items.length === 0 ? (
            <p className="p-3 text-sm text-(--color-awaken-ink-soft)">
              Nothing yet. Payments and uploaded slips appear here as they happen.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.paymentId ? `/teacher/payments` : "/teacher"}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg p-2.5 hover:bg-(--color-awaken-bg) ${item.seen ? "" : "bg-(--color-awaken-accent-soft)"}`}
                  >
                    <span className="flex items-start gap-2">
                      <Icon
                        name={item.kind === "payment_paid" ? "payments" : "receipt_long"}
                        className={`!text-base ${item.kind === "payment_paid" ? "text-(--color-awaken-success)" : "text-(--color-awaken-warn)"}`}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="block truncate text-xs text-(--color-awaken-ink-soft)">
                          {item.detail}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
