"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button, Field, Input, Notice } from "@/components/ds";
import type { CheckerDistrict, CheckerStream } from "@/components/campus-match/FreeChecker";

/**
 * The three answers the report is built from, and the passes that refine it.
 *
 * Shown when a student arrives with nothing stored — they bought from the
 * dashboard rather than through the free checker — and again behind "Change my
 * answers", because a Z-score gets re-released and a student moves district.
 *
 * The server writes the document; this only posts to the route that does. A
 * browser has no write on `campusMatch` at all.
 */

export function ReportInputs({
  districts,
  streams,
  zMin,
  zMax,
  initial,
  onDone,
}: {
  districts: CheckerDistrict[];
  streams: CheckerStream[];
  zMin: number;
  zMax: number;
  initial?: { z: number; district: string; stream: string; passes: string[]; medium: boolean };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [z, setZ] = useState(initial ? String(initial.z) : "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [stream, setStream] = useState(initial?.stream ?? "");
  const [passes, setPasses] = useState<Set<string>>(new Set(initial?.passes ?? []));
  const [medium, setMedium] = useState(initial?.medium ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = streams.find((s) => s.key === stream);
  const zNumber = Number(z);
  const zValid = z.trim() !== "" && Number.isFinite(zNumber) && zNumber >= zMin && zNumber <= zMax;
  const ready = zValid && district !== "" && stream !== "";

  function toggle(subject: string) {
    setPasses((current) => {
      const next = new Set(current);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  }

  async function save() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/campus-match/inputs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          z: zNumber,
          district,
          stream,
          passes: chosen?.subjects.filter((s) => passes.has(s)) ?? [],
          medium,
          preferences: [],
        }),
      });
      if (!res.ok) throw new Error("failed");
      onDone?.();
      router.refresh();
    } catch {
      setError("Could not save just now. Try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Your Z-score" hint={`Between ${zMin} and ${zMax}`}>
          <Input
            value={z}
            onChange={(e) => setZ(e.target.value)}
            inputMode="decimal"
            placeholder="1.8500"
            aria-label="Your Z-score"
          />
        </Field>

        <Field label="Your district">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="Your district"
            className="h-12 w-full rounded-full border border-ict-border-dark bg-ict-ink-800 px-4 text-base text-ict-paper-50 outline-none focus:border-ict-orange-500"
          >
            <option value="">Choose</option>
            {districts.map((d) => (
              <option key={d.key} value={d.key}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Your stream">
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            aria-label="Your stream"
            className="h-12 w-full rounded-full border border-ict-border-dark bg-ict-ink-800 px-4 text-base text-ict-paper-50 outline-none focus:border-ict-orange-500"
          >
            <option value="">Choose</option>
            {streams.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {chosen && chosen.subjects.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-ict-ink-300">
            Subjects you passed at C or better
          </p>
          <p className="mt-1 text-xs text-ict-ink-400">
            Optional. Some courses ask for a particular subject; ticking yours removes the ones you
            could not apply for anyway.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chosen.subjects.map((subject) => {
              const on = passes.has(subject);
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggle(subject)}
                  aria-pressed={on}
                  className={
                    on
                      ? "inline-flex h-9 items-center rounded-full bg-ict-orange-500 px-3.5 text-xs font-semibold text-ict-ink-900"
                      : "inline-flex h-9 items-center rounded-full border border-ict-border-dark px-3.5 text-xs font-semibold text-ict-ink-200"
                  }
                >
                  {subject}
                </button>
              );
            })}
          </div>

          <label className="mt-4 flex items-center gap-2.5 text-sm text-ict-ink-200">
            <input
              type="checkbox"
              checked={medium}
              onChange={(e) => setMedium(e.target.checked)}
              className="size-4 accent-[var(--color-ict-orange-500)]"
            />
            I can study in English medium
          </label>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} disabled={!ready || busy}>
          {busy ? "Saving" : "Build my report"}
        </Button>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="text-sm font-semibold text-ict-ink-300 underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
