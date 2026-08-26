"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Grants the free trial then reloads the page so the server re-checks
 * `hasAccess` and the unlocked content appears — no separate "success"
 * screen needed.
 */
export function StartTrialButton({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/trial/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      if (!res.ok) {
        const { error: code } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          code === "trial_already_used"
            ? "You've already used your free trial for this subject."
            : "Could not start the trial. Try again.",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the trial.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={busy}
        className="rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Starting…" : "Start free 7-day trial"}
      </button>
      {error ? <p className="mt-1 text-xs text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
