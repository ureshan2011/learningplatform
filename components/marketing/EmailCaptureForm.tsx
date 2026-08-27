"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Captures an email address for the free content hub (articles + video
 * discussions) advertised on the landing page. Posts to /api/leads, which is
 * intentionally anonymous — most visitors here have never signed in.
 *
 * `source` tags where on the page the signup happened (hero, resources
 * section, final CTA), so the teacher can see which placement actually
 * converts once there's real traffic.
 */
export function EmailCaptureForm({
  source,
  buttonLabel = "Notify me",
  placeholder = "you@email.com",
  className,
}: {
  source: string;
  buttonLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error("Could not save that address. Check it and try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border border-(--color-awaken-success)/30 bg-(--color-awaken-success-soft) px-4 py-3 text-sm font-semibold text-(--color-awaken-success) ${className ?? ""}`}
      >
        <Icon name="check_circle" className="!text-lg" />
        You&apos;re on the list — we&apos;ll email you when we publish.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Email address</span>
          <Icon
            name="mail"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 !text-lg text-(--color-awaken-ink-soft)"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) py-3 pr-3 pl-10 text-base outline-none focus:border-(--color-awaken-accent)"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(234,88,12,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Sending…" : buttonLabel}
          <Icon name="send" className="!text-base" />
        </button>
      </div>
      <p className="mt-1.5 text-xs text-(--color-awaken-ink-soft)">Free. No spam. Unsubscribe anytime.</p>
      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </form>
  );
}
