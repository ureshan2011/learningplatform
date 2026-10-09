"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button, Field, Input, Notice } from "@/components/ds";

/**
 * The Exam Pack console's controls. English only, like the rest of the console.
 *
 * Every one of them is a POST to a teacher route followed by a refresh of the
 * server-rendered page — the page is the source of truth, so nothing here keeps
 * its own copy of state that could drift from Firestore.
 */

const ERRORS: Record<string, string> = {
  payhere_not_configured:
    "Card payment is not connected, and this pack is sold by card only. Add your PayHere details in Teacher → Payments first.",
  not_a_meet_link: "That is not a Google Meet link. It should start with https://meet.google.com/",
  slot_booked: "That time has been booked. Cancel the booking instead, so the student gets their consultation back.",
  invalid_request: "Something in the form is not right. Check it and try again.",
  not_permitted: "Your sign-in does not allow this. Sign in again as the teacher.",
};

async function post(endpoint: string, body: unknown, method = "POST"): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetchWithSession(endpoint, {
    method,
    headers: { "content-type": "application/json" },
    ...(method === "DELETE" ? {} : { body: JSON.stringify(body) }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

function errorText(data: Record<string, unknown>): string {
  const code = typeof data.error === "string" ? data.error : "";
  if (typeof data.message === "string" && data.message) return data.message;
  return ERRORS[code] ?? "That did not work. Try again.";
}

/** One button, one POST, then the page re-renders. `confirm` makes it a two-tap action. */
export function ActionButton({
  endpoint,
  body,
  label,
  busyLabel = "Working…",
  confirm,
  variant = "outline",
  method = "POST",
  done,
}: {
  endpoint: string;
  body?: unknown;
  label: string;
  busyLabel?: string;
  confirm?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  method?: "POST" | "DELETE";
  /** Shown after it worked, for actions whose effect is not visible on the page. */
  done?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);

  async function run() {
    if (confirm && !armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { ok, data } = await post(endpoint, body ?? {}, method);
      if (!ok) {
        setMessage({ tone: "danger", text: errorText(data) });
        return;
      }
      if (done) setMessage({ tone: "success", text: done });
      router.refresh();
    } catch {
      setMessage({ tone: "danger", text: "Could not reach the server. Try again." });
    } finally {
      setBusy(false);
      setArmed(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1.5">
      <Button size="sm" arrow="none" variant={variant} onClick={run} disabled={busy}>
        {busy ? busyLabel : armed && confirm ? confirm : label}
      </Button>
      {message ? (
        <span className={message.tone === "danger" ? "text-xs text-ict-danger-fg" : "text-xs text-ict-fg-soft"}>
          {message.text}
        </span>
      ) : null}
    </span>
  );
}

const SELECT =
  "h-12 w-full rounded-full border border-ict-line bg-ict-surface-raised px-4 text-base text-ict-fg outline-none focus:border-ict-orange-500";

function useSubmit(endpoint: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  async function submit(body: unknown, success: (data: Record<string, unknown>) => string) {
    setBusy(true);
    setMessage(null);
    try {
      const { ok, data } = await post(endpoint, body);
      if (!ok) {
        setMessage({ tone: "danger", text: errorText(data) });
        return false;
      }
      setMessage({ tone: "success", text: success(data) });
      router.refresh();
      return true;
    } catch {
      setMessage({ tone: "danger", text: "Could not reach the server. Try again." });
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, submit };
}

function Message({ message }: { message: { tone: "danger" | "success"; text: string } | null }) {
  return message ? <Notice tone={message.tone} className="mt-3">{message.text}</Notice> : null;
}

/** Price and access period. */
export function PriceForm({ feeLKR, accessDays }: { feeLKR: number; accessDays: number }) {
  const [fee, setFee] = useState(String(feeLKR));
  const [days, setDays] = useState(String(accessDays));
  const { busy, message, submit } = useSubmit("/api/teacher/exam-pack");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(
          { action: "price", feeLKR: Number(fee), accessDays: Number(days) },
          () => "Saved. New buyers pay this; anyone who already bought keeps what they paid for.",
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (Rs)" hint="One payment, card only">
          <Input inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Access (days)" hint="From the day they buy. 400 is about 13 months.">
          <Input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
        </Field>
      </div>
      <Button type="submit" size="sm" arrow="none" disabled={busy} className="mt-4">
        {busy ? "Saving…" : "Save price"}
      </Button>
      <Message message={message} />
    </form>
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The weekly live's day, time, length and title — all Sri Lanka time. */
export function ScheduleForm({
  live,
}: {
  live: { enabled: boolean; weekday: number; time: string; durationMinutes: number; title: string };
}) {
  const [enabled, setEnabled] = useState(live.enabled);
  const [weekday, setWeekday] = useState(live.weekday);
  const [time, setTime] = useState(live.time);
  const [minutes, setMinutes] = useState(String(live.durationMinutes));
  const [title, setTitle] = useState(live.title);
  const { busy, message, submit } = useSubmit("/api/teacher/exam-pack");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(
          { action: "schedule", enabled, weekday, time, durationMinutes: Number(minutes), title: title.trim() },
          (data) =>
            Number(data.cleared) > 0
              ? `Saved. ${data.cleared} week${data.cleared === 1 ? "" : "s"} already prepared at the old time were removed and will be made again at the new one.`
              : "Saved.",
        );
      }}
    >
      <Field label="Title students see">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </Field>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Day (Sri Lanka)">
          <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className={SELECT}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Time (Sri Lanka)">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Length (minutes)" hint="Free Google accounts stop group calls at 60">
          <Input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2.5 text-sm text-ict-fg">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-4 accent-ict-orange-500"
        />
        Run the weekly live
      </label>
      <Button type="submit" size="sm" arrow="none" disabled={busy} className="mt-4">
        {busy ? "Saving…" : "Save schedule"}
      </Button>
      <Message message={message} />
    </form>
  );
}

/** Publishes an evening of back-to-back 30-minute consultation slots. */
export function SlotsForm({ minDate }: { minDate: string }) {
  const [date, setDate] = useState(minDate);
  const [time, setTime] = useState("19:00");
  const [count, setCount] = useState("4");
  const { busy, message, submit } = useSubmit("/api/teacher/exam-pack/consultations");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit({ action: "create_slots", date, time, count: Number(count) }, (data) =>
          Number(data.skipped) > 0
            ? `${data.created} added. ${data.skipped} skipped — already published, or in the past.`
            : `${data.created} added.`,
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date (Sri Lanka)">
          <Input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="First slot starts (Sri Lanka)">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="How many, back to back" hint="30 minutes each">
          <Input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))} />
        </Field>
      </div>
      <Button type="submit" size="sm" arrow="none" disabled={busy} className="mt-4">
        {busy ? "Publishing…" : "Publish slots"}
      </Button>
      <Message message={message} />
    </form>
  );
}

/** Pastes a Meet link by hand — for when Google is not connected, or a link has to change. */
export function ManualLinkForm({
  endpoint,
  body,
  current,
}: {
  endpoint: string;
  /** Everything but the url — `{ action: "link", id }` or `{ action: "link", bookingId }`. */
  body: Record<string, unknown>;
  current?: string;
}) {
  const [url, setUrl] = useState(current ?? "");
  const { busy, message, submit } = useSubmit(endpoint);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit({ ...body, url: url.trim() || null }, () => (url.trim() ? "Link saved." : "Link removed."));
      }}
    >
      <div className="min-w-[220px] flex-1">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" />
      </div>
      <Button type="submit" size="sm" arrow="none" variant="outline" disabled={busy}>
        {busy ? "Saving…" : current ? "Update link" : "Use this link"}
      </Button>
      <div className="w-full">
        <Message message={message} />
      </div>
    </form>
  );
}

/** The OAuth client from the Google Cloud console. The secret is never shown back. */
export function GoogleClientForm({ hasClient }: { hasClient: boolean }) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const { busy, message, submit } = useSubmit("/api/teacher/google");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }, () => {
          setClientSecret("");
          return "Saved. Now press Connect Google.";
        });
      }}
    >
      <div className="grid gap-4">
        <Field label="Client ID" hint="Ends in .apps.googleusercontent.com">
          <Input value={clientId} onChange={(e) => setClientId(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Client secret" hint={hasClient ? "One is saved. Enter a new one only to replace it." : undefined}>
          <Input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            autoComplete="off"
          />
        </Field>
      </div>
      <Button type="submit" size="sm" arrow="none" disabled={busy || !clientId || !clientSecret} className="mt-4">
        {busy ? "Saving…" : hasClient ? "Replace the client" : "Save the client"}
      </Button>
      <Message message={message} />
    </form>
  );
}

/** Copies the redirect URI the owner has to paste into Google. */
export function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex flex-wrap items-center gap-2">
      <code className="rounded-ict-md border border-ict-line bg-ict-surface-sunken px-2.5 py-1.5 font-mono text-xs break-all text-ict-fg">
        {text}
      </code>
      <Button
        size="sm"
        variant="ghost"
        arrow="none"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => setCopied(true));
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </span>
  );
}
