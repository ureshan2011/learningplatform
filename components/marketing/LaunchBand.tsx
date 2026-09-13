import { ButtonLink, Card, Eyebrow } from "@/components/ds-cream";
import { LAUNCH_NOTE } from "@/lib/payments/launch";

/**
 * The trial-only launch message, for public pages built from `components/ds-cream`.
 *
 * Renders nothing when payments are open, so a caller can drop it in
 * unconditionally and the page goes back to normal on the day the flag in
 * `lib/payments/launch.ts` flips — no second edit, nothing left behind to
 * find and remove.
 *
 * English only: the public marketing pages are English, and the signed-in
 * screens take the same message from the dictionary under `launch.*`.
 */
export function LaunchBand({
  href = "/go?do=trial&subject=al-ict",
  className,
  show,
}: {
  /** Where the call to action goes. Defaults to the A/L class trial. */
  href?: string;
  className?: string;
  /** The caller's `paymentsPaused()`. Passed in so this stays a pure render. */
  show: boolean;
}) {
  if (!show) return null;

  return (
    <Card radius="card" className={className ? `p-6 ${className}` : "p-6"}>
      <Eyebrow>{LAUNCH_NOTE.eyebrow}</Eyebrow>
      <h2 className="mt-2 font-display text-xl font-extrabold tracking-[-0.02em] text-ict-ink-900">
        {LAUNCH_NOTE.title}
      </h2>
      <p className="mt-2 max-w-[62ch] text-sm text-ict-ink-400">{LAUNCH_NOTE.body}</p>
      <ButtonLink href={href} variant="primary" size="sm" className="mt-4">
        {LAUNCH_NOTE.cta}
      </ButtonLink>
    </Card>
  );
}
