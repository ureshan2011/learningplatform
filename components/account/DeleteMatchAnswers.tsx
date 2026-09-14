"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button, Notice } from "@/components/ds";

/**
 * "Delete what you hold on me", for Campus Match.
 *
 * The privacy policy promises this control by name, so it has to exist and it
 * has to work without writing to anyone. Two taps rather than one: these are
 * answers a student typed and would have to type again, and an accidental tap
 * on a phone should not cost them that.
 *
 * The route behind it is deliberately not gated on `hasAccess` — someone whose
 * access has lapsed must still be able to remove what is held about them.
 */
export function DeleteMatchAnswers({
  labels,
}: {
  labels: {
    title: string;
    body: string;
    action: string;
    confirm: string;
    cancel: string;
    done: string;
    error: string;
    working: string;
  };
}) {
  const router = useRouter();
  const [asked, setAsked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetchWithSession("/api/campus-match/inputs", { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setDone(true);
      setAsked(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <Notice tone="success">{labels.done}</Notice>;
  }

  return (
    <div>
      <p className="text-sm text-ict-ink-300">{labels.body}</p>
      {error ? (
        <div className="mt-3">
          <Notice tone="danger">{labels.error}</Notice>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {asked ? (
          <>
            <Button variant="secondary" onClick={remove} disabled={busy}>
              {busy ? labels.working : labels.confirm}
            </Button>
            <button
              type="button"
              onClick={() => setAsked(false)}
              className="text-sm font-semibold text-ict-ink-300 underline-offset-4 hover:underline"
            >
              {labels.cancel}
            </button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setAsked(true)}>
            {labels.action}
          </Button>
        )}
      </div>
    </div>
  );
}
