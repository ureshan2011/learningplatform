"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button, Card, Field, Input, Notice, SectionHeading } from "@/components/ds";
import { CAMPUS_READY } from "@/lib/content/campus-ready";

/**
 * Turns a date from `<input type="date">` into a Colombo timestamp.
 *
 * A bare date string is midnight UTC, which is 5.30am in Colombo the same day
 * but reads as the *previous* day to anything formatting in local time. The
 * hour matters differently at each end of a cohort, so the caller says which:
 * a start is noon, and an end is the last moment of that day, because access
 * that expires at noon on the final day cuts a student off mid-class.
 */
function colomboTime(date: string, edge: "start" | "end"): number {
  const clock = edge === "start" ? "12:00:00.000" : "23:59:59.999";
  return new Date(`${date}T${clock}+05:30`).getTime();
}

/** Adds days to a `yyyy-mm-dd` string and returns the same format. */
function addDays(date: string, days: number): string {
  if (!date) return "";
  const next = new Date(`${date}T12:00:00+05:30`).getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(next).toISOString().slice(0, 10);
}

/**
 * The URL and document id, derived from the name so the teacher never has to
 * think about one. "Campus Ready — January 2027" becomes
 * "campus-ready-january-2027".
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Opens a Campus Ready intake from the console.
 *
 * A cohort is a subject with fixed dates, so it could in principle be created
 * by editing Firestore — but this platform is set up from a browser by someone
 * who does not use a terminal, and an intake that can only be opened with a
 * command line cannot be opened at all.
 *
 * The end date pre-fills to twelve weeks after the start, and enrolment closes
 * on the start date unless the teacher says otherwise. Both are the answer
 * almost every time; both stay editable because a term that runs long should
 * not need a developer.
 */
export function OpenCohortForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [closesOn, setClosesOn] = useState("");

  const id = slugify(name);

  function onStartChange(value: string) {
    setStartsOn(value);
    // Only ever fills a blank. A teacher who has typed their own end date is
    // not second-guessed because they went back and corrected the start.
    if (value && !endsOn) setEndsOn(addDays(value, CAMPUS_READY.weeks * 7));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (!id) {
      setError("Give the intake a name using English letters — it becomes the web address.");
      return;
    }

    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetchWithSession("/api/teacher/cohorts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          name: name.trim(),
          startsAt: colomboTime(startsOn, "start"),
          endsAt: colomboTime(endsOn, "end"),
          ...(closesOn ? { enrolmentClosesAt: colomboTime(closesOn, "end") } : {}),
          feeLKR: Number(form.get("feeLKR") ?? CAMPUS_READY.feeLKR),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; name?: string };
      if (!res.ok) throw new Error(MESSAGES[data.error ?? ""] ?? "Could not open the intake.");

      setDone(`${data.name} is open. Students can enrol now.`);
      setName("");
      setStartsOn("");
      setEndsOn("");
      setClosesOn("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card radius="card" className="p-5">
      <SectionHeading as="h2">Open a Campus Ready intake</SectionHeading>
      <p className="mt-1.5 text-sm text-ict-ink-300">
        A {CAMPUS_READY.weeks}-week programme sold as one payment. Everyone starts and finishes
        together, and enrolment shuts on the start date.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-4">
        <Field
          label="Intake name"
          hint={id ? `Web address: /campus/${id}` : "For example: Campus Ready — January 2027"}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campus Ready — January 2027"
            required
            maxLength={120}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts on">
            <Input
              type="date"
              value={startsOn}
              onChange={(e) => onStartChange(e.target.value)}
              required
            />
          </Field>
          <Field label="Ends on" hint={`Fills in as ${CAMPUS_READY.weeks} weeks after the start.`}>
            <Input
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Enrolment closes" hint="Leave blank to close on the start date.">
            <Input type="date" value={closesOn} onChange={(e) => setClosesOn(e.target.value)} />
          </Field>
          <Field label="Fee (Rs)" hint="The whole programme, not per month.">
            <Input
              name="feeLKR"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={CAMPUS_READY.feeLKR}
              required
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Opening…" : "Open this intake"}
          </Button>
        </div>

        {error ? <Notice tone="danger">{error}</Notice> : null}
        {done ? <Notice tone="success">{done}</Notice> : null}
      </form>
    </Card>
  );
}

/** Route errors, said the way the person reading them can act on. */
const MESSAGES: Record<string, string> = {
  ends_before_start: "The end date has to come after the start date.",
  enrolment_closes_after_end: "Enrolment cannot close after the intake has finished.",
  invalid_request: "Check the dates and the fee — something there is not valid.",
  not_permitted: "Only a teacher can open an intake.",
};
