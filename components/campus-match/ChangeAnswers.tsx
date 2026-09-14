"use client";

import { useState } from "react";
import { Card } from "@/components/ds";
import { ReportInputs, type InputLabels } from "@/components/campus-match/ReportInputs";
import type { CheckerDistrict, CheckerStream } from "@/components/campus-match/FreeChecker";

/**
 * "Change my answers", folded away until it is wanted.
 *
 * A Z-score gets re-released after a recorrection and a student can move
 * district between results and the application, so the answers have to stay
 * editable — but they are not what the student came to the page to read, so
 * they do not sit above the bands.
 */

export function ChangeAnswers({
  districts,
  streams,
  zMin,
  zMax,
  initial,
  labels,
}: {
  districts: CheckerDistrict[];
  streams: CheckerStream[];
  zMin: number;
  zMax: number;
  initial: { z: number; district: string; stream: string; passes: string[]; medium: boolean };
  labels: { open: string; hint: string; inputs: InputLabels };
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-ict-ink-300 underline-offset-4 hover:underline"
      >
        {labels.open}
      </button>
    );
  }

  return (
    <Card radius="panel" className="p-5 sm:p-6">
      <p className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
        {labels.open}
      </p>
      <p className="mt-1 mb-4 text-sm text-ict-ink-300">{labels.hint}</p>
      <ReportInputs
        districts={districts}
        streams={streams}
        zMin={zMin}
        zMax={zMax}
        initial={initial}
        labels={labels.inputs}
        onDone={() => setOpen(false)}
      />
    </Card>
  );
}
