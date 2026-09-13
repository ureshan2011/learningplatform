import { Notice } from "@/components/ds";

/**
 * The "we are not taking payments yet" line, for signed-in screens.
 *
 * Rendered wherever a price or a payment button used to be, so a student never
 * finds a fee with nothing to do about it. Takes its strings as props rather
 * than calling `getT()` itself: this sits inside both server and client trees,
 * and the dictionary never ships to the browser.
 *
 * A `Notice`, not a second `Card variant="feature"` — the screens that show it
 * already spend their one cocoa panel on the thing the student came for.
 */
export function LaunchNotice({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <Notice tone="info" className={className}>
      {message}
    </Notice>
  );
}
