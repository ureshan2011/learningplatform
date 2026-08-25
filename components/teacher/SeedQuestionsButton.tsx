"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Loads the starter practice question bank so Practice has real content to test on day one. */
export function SeedQuestionsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/questions/seed", { method: "POST" });
      if (!res.ok) throw new Error("Could not load the question bank. Try again.");
      const data = (await res.json()) as { created: number };
      setDone(data.created);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
      <p className="font-semibold">Practice question bank</p>
      <p className="mt-1.5 text-sm text-(--color-awaken-ink-soft)">
        Loads a starter set of O/L and A/L ICT practice questions — real content with
        exam-style misconception notes, ready for students to start Practice with today. Safe
        to run again after editing <code className="text-xs">lib/content/question-seed.ts</code>.
      </p>
      <button
        onClick={seed}
        disabled={busy}
        className="mt-4 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Loading…" : "Load question bank"}
      </button>
      {done !== null ? (
        <p className="mt-2 text-sm text-(--color-awaken-success)">Loaded {done} questions.</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
