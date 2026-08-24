"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * First-run helper: creates the two default ICT subjects.
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
      const res = await fetch("/api/teacher/subjects/seed", { method: "POST" });
      if (!res.ok) throw new Error("Could not create the subjects. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[--color-brand]/30 bg-[--color-brand]/10 p-5">
      <p className="font-semibold text-[--color-brand]">Start here</p>
      <p className="mt-1.5 text-sm text-white/70">
        You have no subjects yet. This creates <strong>O/L ICT</strong> at Rs 1,500/month and{" "}
        <strong>A/L ICT</strong> at Rs 2,500/month. You can change the prices and descriptions
        afterwards.
      </p>
      <button
        onClick={seed}
        disabled={busy}
        className="mt-4 rounded-lg bg-[--color-brand] px-5 py-2.5 font-semibold text-black disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create my two subjects"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
