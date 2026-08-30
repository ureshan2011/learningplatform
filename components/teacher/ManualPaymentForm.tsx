"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const inputClass =
  "w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-base outline-none focus:border-(--color-awaken-accent)";

/**
 * Records money that arrived outside the platform — cash at class, a direct
 * transfer, a parent who paid at the counter and never uploaded anything.
 *
 * The student is found by phone number, because that is what a teacher has in
 * their hand and it is the identity the whole platform is keyed on. Saving
 * grants the month immediately and issues a receipt number, so the books stay
 * complete without anyone remembering to reconcile a cash tin later.
 */
export function ManualPaymentForm({
  subjects,
}: {
  subjects: Array<{ id: string; name: string; priceLKR: number }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");

  const selected = subjects.find((s) => s.id === subjectId);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const dateValue = String(form.get("paidOn") ?? "");

    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/teacher/payments/record", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: String(form.get("phone") ?? ""),
          subjectId,
          amountLKR: Number(form.get("amountLKR") ?? 0),
          months: Number(form.get("months") ?? 1),
          // A date with no time is midnight UTC; classes and books both run on
          // Colombo time, so noon keeps it on the day the teacher picked.
          ...(dateValue ? { paidAt: new Date(`${dateValue}T12:00:00+05:30`).getTime() } : {}),
          bankRef: String(form.get("bankRef") ?? ""),
          note: String(form.get("note") ?? ""),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        studentName?: string;
        subjectName?: string;
      };
      if (!res.ok) {
        throw new Error(
          data.error === "student_not_found"
            ? "No student account has that phone number. They must sign in once first."
            : data.error === "invalid_phone"
              ? "That does not look like a Sri Lankan mobile number."
              : "Could not save the payment. Try again.",
        );
      }

      setDone(`${data.studentName} now has ${data.subjectName} — receipt issued.`);
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  if (subjects.length === 0) {
    return (
      <p className="text-sm text-(--color-awaken-ink-soft)">Create a subject first.</p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
            Student&apos;s phone
          </span>
          <input
            name="phone"
            required
            inputMode="tel"
            placeholder="077 123 4567"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
            Subject
          </span>
          <select
            name="subjectId"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={inputClass}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
            Amount received (Rs)
          </span>
          <input
            name="amountLKR"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={selected?.priceLKR ?? 0}
            key={selected?.id}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
            Months paid for
          </span>
          <input
            name="months"
            type="number"
            min={1}
            max={12}
            defaultValue={1}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
            Date received
          </span>
          <input name="paidOn" type="date" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
            Bank / deposit reference
          </span>
          <input name="bankRef" placeholder="Optional" maxLength={120} className={inputClass} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">
          Note
        </span>
        <input
          name="note"
          placeholder="e.g. paid in cash after Saturday class"
          maxLength={300}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        <Icon name="check_circle" className="!text-base" />
        {busy ? "Saving…" : "Record payment & unlock"}
      </button>

      {done ? <p className="text-sm font-semibold text-(--color-awaken-success)">{done}</p> : null}
      {error ? <p className="text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </form>
  );
}
