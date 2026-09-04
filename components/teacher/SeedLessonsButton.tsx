"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";

/** Loads the full A/L ICT unit and lesson breakdown so the syllabus page has real content on day one. */
export function SeedLessonsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/teacher/subjects/units/seed", { method: "POST" });
      if (!res.ok) throw new Error("Could not load the syllabus. Try again.");
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
      <p className="font-semibold">A/L ICT syllabus breakdown</p>
      <p className="mt-1.5 text-sm text-(--color-awaken-ink-soft)">
        Loads all 14 NIE syllabus units and their competency-level lessons, each with
        exam-targeted objectives and exam-focus notes — no lesson content yet, just the full
        structure to plan against. Safe to run again after editing{" "}
        <code className="text-xs">lib/content/al-ict-units.ts</code>.
      </p>
      <button
        onClick={seed}
        disabled={busy}
        className="mt-4 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Loading…" : "Load syllabus breakdown"}
      </button>
      {done !== null ? (
        <p className="mt-2 text-sm text-(--color-awaken-success)">Loaded {done} units.</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
