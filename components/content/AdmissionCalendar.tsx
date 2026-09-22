import { Badge, Card } from "@/components/ds";
import type { CalendarStep } from "@/lib/content/admission-calendar";

/**
 * A dated list of admission steps. Each one says whether its date is confirmed
 * by the Department of Examinations or the UGC, or only expected — a student
 * planning around a deadline needs to know which kind they are looking at.
 */
export function AdmissionCalendar({
  steps,
  lang = "en",
}: {
  steps: CalendarStep[];
  lang?: "en" | "si";
}) {
  const labels =
    lang === "si"
      ? {
          confirmed: "තහවුරුයි",
          expected: "බලාපොරොත්තු වෙන",
          source: "මූලාශ්‍රය",
        }
      : { confirmed: "Confirmed", expected: "Expected", source: "Source" };

  return (
    <ol className="space-y-3">
      {steps.map((raw) => {
        const step = lang === "si" ? { ...raw, ...raw.si } : raw;
        return (
          <li key={raw.what}>
            <Card radius="card" className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-base font-bold text-ict-fg">
                  {step.what}
                </p>
                <Badge
                  tone={step.status === "confirmed" ? "success" : "neutral"}
                >
                  {step.status === "confirmed"
                    ? labels.confirmed
                    : labels.expected}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-semibold text-ict-fg-soft">
                {step.when}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ict-fg-mute">
                {step.note}
              </p>
              {step.source ? (
                <p className="mt-2 text-xs text-ict-fg-dim">
                  {labels.source}:{" "}
                  <a
                    href={step.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-ict-fg-soft"
                  >
                    {step.source.label}
                  </a>
                </p>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
