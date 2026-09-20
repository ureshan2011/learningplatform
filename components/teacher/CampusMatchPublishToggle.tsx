"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";

/**
 * The one switch that puts Campus Match on sale.
 *
 * Never auto-published. Read SOURCES.md and BACKTEST.md and look at ten degree
 * profiles first — every number a student pays for comes out of those files,
 * and nobody else is going to check them.
 *
 * Publishing also activates the product, so this is the only action needed.
 */
export function CampusMatchPublishToggle({
  published,
  stale,
}: {
  published: boolean;
  /** The dataset is old enough that a newer round has probably been released. */
  stale: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/teacher/campus-match/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (res.status === 409) {
        throw new Error(
          "The cut-off data is too old to sell. Run the pipeline for the newest UGC round first.",
        );
      }
      if (!res.ok) throw new Error("Could not update. Try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-ict-md border border-ict-line bg-ict-surface-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {published ? "On sale — students can buy this" : "Not on sale — hidden from students"}
          </p>
          <p className="mt-1 text-sm text-ict-fg-soft">
            {published
              ? "Take it off sale if a figure looks wrong, or as soon as the UGC publishes a newer round."
              : "Read SOURCES.md and BACKTEST.md, and look at ten degree profiles, before you flip this."}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy || (stale && !published)}
          className={
            published
              ? "shrink-0 rounded-full border border-ict-line px-5 py-2.5 font-semibold disabled:opacity-50"
              : "shrink-0 rounded-full bg-ict-orange-500 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          }
        >
          {busy ? "Saving…" : published ? "Take off sale" : "Put on sale"}
        </button>
      </div>
      {stale && !published ? (
        <p className="mt-2 text-sm text-ict-fg-soft">
          The data is out of date, so this cannot go on sale until the pipeline has run for the
          newest round.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-ict-danger-fg">{error}</p> : null}
    </div>
  );
}
