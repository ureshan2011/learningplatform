"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";

/**
 * The one switch that makes the 2027 predicted paper visible to students.
 * Never auto-published — read the full preview on this page first, every
 * question and its Sinhala wording, then flip this once.
 */
export function PredictedPaperPublishToggle({ published }: { published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/teacher/predicted-paper/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (!res.ok) throw new Error("Could not update. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {published ? "Published — students can see this" : "Draft — hidden from students"}
          </p>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            {published
              ? "Unpublish if you spot something wrong with a question or the Sinhala wording."
              : "Read every question below first, especially the Sinhala — it has not had a native-speaker check yet."}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={
            published
              ? "shrink-0 rounded-lg border border-(--color-awaken-line) px-5 py-2.5 font-semibold disabled:opacity-50"
              : "shrink-0 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          }
        >
          {busy ? "Saving…" : published ? "Unpublish" : "Publish to students"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
