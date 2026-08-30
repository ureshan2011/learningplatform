"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

/**
 * The rehearsal button: run one PayHere notification through this platform
 * without PayHere.
 *
 * Only rendered in sandbox mode. It proves the half of the flow a laptop
 * cannot otherwise reach — signature check, ledger write, receipt number,
 * unlock, teacher notification — so that when a real sandbox card is finally
 * used, anything still broken is on PayHere's side of the line and not ours.
 */
export function SandboxTestPanel({
  subjects,
}: {
  subjects: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/teacher/payments/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: String(form.get("phone") ?? ""),
          subjectId: String(form.get("subjectId") ?? ""),
          statusCode: String(form.get("statusCode") ?? "2"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        studentName?: string;
        subjectName?: string;
        orderId?: string;
        unlocked?: boolean;
      };

      if (!res.ok) {
        throw new Error(
          data.error === "student_not_found"
            ? "No account with that phone number. Sign in as that student once first."
            : data.error === "live_mode"
              ? "Refused: this platform is in LIVE mode. Test payments only run in sandbox."
              : data.error === "not_configured"
                ? "Add your PayHere sandbox merchant id and secret below first."
                : "Could not run the test.",
        );
      }

      setResult(
        data.unlocked
          ? `Worked. ${data.studentName} now has ${data.subjectName}, with a receipt. Order ${data.orderId}.`
          : `Notification processed as requested — no unlock. Order ${data.orderId}.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={run} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-(--color-awaken-ink-soft)">
            Test student&apos;s phone
          </span>
          <input
            name="phone"
            required
            inputMode="tel"
            placeholder="077 123 4567"
            className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2 text-sm outline-none focus:border-(--color-awaken-accent)"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-(--color-awaken-ink-soft)">
            Subject
          </span>
          <select
            name="subjectId"
            className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-(--color-awaken-ink-soft)">
            Outcome to rehearse
          </span>
          <select
            name="statusCode"
            className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2 text-sm"
          >
            <option value="2">Payment successful</option>
            <option value="0">Pending</option>
            <option value="-1">Cancelled by student</option>
            <option value="-2">Failed</option>
            <option value="-3">Chargeback</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-(--color-awaken-accent)/40 bg-(--color-awaken-accent-soft) px-4 py-2 text-sm font-semibold text-(--color-awaken-accent) disabled:opacity-50"
      >
        <Icon name="rule" className="!text-base" />
        {busy ? "Running…" : "Run a sandbox test payment"}
      </button>

      {result ? (
        <p className="text-sm font-semibold text-(--color-awaken-success)">{result}</p>
      ) : null}
      {error ? <p className="text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </form>
  );
}
