"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { fetchWithSession } from "@/lib/auth/session-client";
import { track } from "@/lib/analytics";
import { Button, Card, Notice } from "@/components/ds";

export interface SlotOption {
  id: string;
  /** "Saturday 18 October", in Sri Lanka time — formatted on the server. */
  day: string;
  /** "9:30 am". */
  time: string;
}

export interface BookerLabels {
  pick: string;
  note: string;
  notePlaceholder: string;
  book: string;
  booking: string;
  none: string;
  taken: string;
  tooSoon: string;
  already: string;
  failed: string;
}

/**
 * Picks a consultation slot and books it.
 *
 * Slots are grouped by day and shown in Sri Lanka time, formatted on the
 * server so a phone with the wrong time zone still reads the right hour. The
 * booking itself is a transaction on the server — if two students tap the same
 * slot, one of them is told it has just gone and picks another.
 */
export function ConsultationBooker({
  slots,
  noteMax,
  labels,
}: {
  slots: SlotOption[];
  noteMax: number;
  labels: BookerLabels;
}) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (slots.length === 0) return <Notice tone="info">{labels.none}</Notice>;

  const days = Array.from(new Set(slots.map((s) => s.day)));

  async function book() {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/exam-pack/consultation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "book", slotId: chosen, note: note.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          data.error === "slot_taken" || data.error === "slot_missing"
            ? labels.taken
            : data.error === "too_soon"
              ? labels.tooSoon
              : data.error === "already_booked"
                ? labels.already
                : labels.failed,
        );
        if (data.error === "slot_taken" || data.error === "slot_missing") {
          setChosen(null);
          router.refresh();
        }
        return;
      }
      track("exam_pack_consultation_booked", {});
      router.refresh();
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card radius="card" className="p-5">
      <p className="text-sm font-semibold text-ict-fg">{labels.pick}</p>
      <div className="mt-3 space-y-4">
        {days.map((day) => (
          <div key={day}>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-ict-fg-soft">{day}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {slots
                .filter((s) => s.day === day)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setChosen(s.id)}
                    className={clsx(
                      "h-9 rounded-full px-4 text-sm font-semibold transition-colors duration-[120ms]",
                      chosen === s.id
                        ? "bg-ict-orange-500 text-white"
                        : "border border-ict-line bg-ict-surface-raised text-ict-fg hover:border-ict-line-strong",
                    )}
                  >
                    {s.time}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-ict-fg-soft">{labels.note}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, noteMax))}
          rows={3}
          placeholder={labels.notePlaceholder}
          className="w-full rounded-ict-md border border-ict-line bg-ict-surface-raised px-4 py-3 text-base text-ict-fg outline-none placeholder:text-ict-fg-mute focus:border-ict-orange-500"
        />
      </label>

      <Button onClick={book} disabled={!chosen || busy} className="mt-4 w-full justify-center">
        {busy ? labels.booking : labels.book}
      </Button>
      {error ? <Notice tone="danger" className="mt-3">{error}</Notice> : null}
    </Card>
  );
}

/** Moves a booking — allowed until 12 hours before. The server enforces the cut-off; this only asks. */
export function CancelBookingButton({
  labels,
}: {
  labels: { cancel: string; confirm: string; tooLate: string; failed: string };
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/exam-pack/consultation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error === "too_late" ? labels.tooLate : labels.failed);
        return;
      }
      router.refresh();
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div>
      <Button variant="outline" size="sm" arrow="none" onClick={cancel} disabled={busy}>
        {confirming ? labels.confirm : labels.cancel}
      </Button>
      {error ? <p className="mt-2 text-sm text-ict-fg-soft">{error}</p> : null}
    </div>
  );
}
