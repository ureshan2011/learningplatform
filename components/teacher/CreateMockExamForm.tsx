"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";

/**
 * Creates a mock exam: picks `questionCount` active questions for the
 * subject (optionally narrowed to one topic or year) and freezes them as
 * the paper everyone sits. Real A/L MCQ papers use negative
 * marking, so that field defaults to a fraction rather than off — leave it
 * at 0 for a paper that should not penalise a wrong guess.
 */
export function CreateMockExamForm({
  subjects,
}: {
  subjects: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage(null);

    const topic = String(form.get("topic") ?? "").trim();
    const year = String(form.get("year") ?? "").trim();

    try {
      const res = await fetchWithSession("/api/teacher/mock-exams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectId: form.get("subjectId"),
          title: form.get("title"),
          durationMinutes: Number(form.get("durationMinutes")) || 60,
          negativeMarking: Number(form.get("negativeMarking")) || 0,
          questionCount: Number(form.get("questionCount")) || 20,
          topic: topic || undefined,
          year: year ? Number(year) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error === "not_enough_questions"
            ? `Only ${data.available} matching question${data.available === 1 ? "" : "s"} in the bank — add more or ask for fewer.`
            : "Could not create the mock exam.",
        );
      }

      setMessage({ tone: "ok", text: "Mock exam created." });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
      <Field label="Subject">
        <select name="subjectId" required className={inputClass}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id} className="bg-(--color-awaken-bg)">
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Title">
        <input name="title" required maxLength={140} placeholder="2023 A/L ICT — Paper I" className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Duration (minutes)">
          <input name="durationMinutes" type="number" min={5} max={240} defaultValue={60} className={inputClass} />
        </Field>
        <Field label="Number of questions">
          <input name="questionCount" type="number" min={1} max={200} defaultValue={20} className={inputClass} />
        </Field>
      </div>

      <Field
        label="Negative marking per wrong answer"
        hint="Real A/L MCQ papers deduct marks for a wrong answer. Leave at 0 for none."
      >
        <input name="negativeMarking" type="number" min={0} max={1} step={0.01} defaultValue={0.33} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Topic (optional)" hint="Leave blank to draw from every topic.">
          <input name="topic" maxLength={140} placeholder="e.g. Databases" className={inputClass} />
        </Field>
        <Field label="Past-paper year (optional)" hint="Only if questions are tagged with a year.">
          <input name="year" type="number" min={1990} max={2100} placeholder="e.g. 2023" className={inputClass} />
        </Field>
      </div>

      <button type="submit" disabled={busy} className="w-full rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "Creating…" : "Create mock exam"}
      </button>

      {message ? (
        <p className={`text-sm ${message.tone === "ok" ? "text-(--color-awaken-success)" : "text-(--color-awaken-danger)"}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-base outline-none focus:border-(--color-awaken-accent)";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-(--color-awaken-ink-soft)">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-(--color-awaken-ink-soft)">{hint}</span> : null}
    </label>
  );
}
