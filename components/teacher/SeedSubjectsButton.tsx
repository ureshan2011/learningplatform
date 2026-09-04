"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";

/**
 * First-run helper: creates the A/L ICT subject.
 *
 * Shown only while the platform has none, so a new teacher never sees an empty
 * console with no way forward.
 */
export function SeedSubjectsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/teacher/subjects/seed", { method: "POST" });
      if (!res.ok) throw new Error("Could not create the subjects. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-5">
      <p className="font-semibold text-(--color-awaken-accent)">Start here</p>
      <p className="mt-1.5 text-sm text-(--color-awaken-ink-soft)">
        You have no subjects yet. This creates <strong>A/L ICT</strong> at Rs 2,500/month. You can
        change the price and description afterwards.
      </p>
      <button
        onClick={seed}
        disabled={busy}
        className="mt-4 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create my A/L ICT class"}
      </button>
      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
