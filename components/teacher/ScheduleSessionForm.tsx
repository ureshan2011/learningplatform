"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Creates a class: a Zoom meeting plus, optionally, the RTMP simulcast that
 * carries the class to students beyond the Zoom licence.
 *
 * The stream key is write-only from here — it is stored server-side in
 * `sessionSecrets` and never rendered back into the page.
 */
export function ScheduleSessionForm({
  subjects,
}: {
  subjects: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [simulcast, setSimulcast] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage(null);

    // datetime-local has no timezone; the teacher is in Colombo and so is the
    // browser, so parsing it locally is correct here.
    const startsAt = new Date(String(form.get("startsAt"))).getTime();
    if (!Number.isFinite(startsAt)) {
      setMessage({ tone: "err", text: "Pick a valid start time." });
      setBusy(false);
      return;
    }

    const streamUrl = String(form.get("streamUrl") ?? "").trim();
    const streamKey = String(form.get("streamKey") ?? "").trim();

    try {
      const res = await fetch("/api/teacher/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectId: form.get("subjectId"),
          title: form.get("title"),
          topic: form.get("topic"),
          startsAt,
          durationMinutes: Number(form.get("durationMinutes")) || 90,
          hlsUrl: String(form.get("hlsUrl") ?? "").trim() || undefined,
          rtmp: simulcast && streamUrl && streamKey ? { streamUrl, streamKey } : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error === "zoom_failed"
            ? "Zoom rejected the meeting. Check your Zoom app credentials."
            : "Could not schedule the class.",
        );
      }

      setMessage({ tone: "ok", text: "Class scheduled." });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
      <Field label="Subject">
        <select name="subjectId" required className={inputClass}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id} className="bg-(--color-awaken-bg)">
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Class title">
        <input name="title" required maxLength={140} placeholder="Databases — Lesson 4" className={inputClass} />
      </Field>

      <Field label="Topic">
        <input name="topic" required maxLength={140} placeholder="Normalization" className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts at">
          <input name="startsAt" type="datetime-local" required className={inputClass} />
        </Field>
        <Field label="Duration (minutes)">
          <input name="durationMinutes" type="number" min={15} max={300} defaultValue={90} className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-(--color-awaken-ink-soft)">
        <input
          type="checkbox"
          checked={simulcast}
          onChange={(e) => setSimulcast(e.target.checked)}
          className="size-4"
        />
        Simulcast to YouTube Live (lets the class grow past your Zoom seat limit)
      </label>

      {simulcast ? (
        <div className="space-y-4 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-4">
          <Field label="RTMP stream URL" hint="From YouTube Studio → Go live → Stream settings.">
            <input name="streamUrl" placeholder="rtmp://a.rtmp.youtube.com/live2" className={inputClass} />
          </Field>
          <Field label="Stream key" hint="Stored securely and never shown again.">
            <input name="streamKey" type="password" autoComplete="off" className={inputClass} />
          </Field>
          <Field label="HLS playback URL" hint="What mobile and overflow students watch in the app.">
            <input name="hlsUrl" placeholder="https://…/index.m3u8" className={inputClass} />
          </Field>
        </div>
      ) : null}

      <button type="submit" disabled={busy} className="w-full rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "Creating…" : "Schedule class"}
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
