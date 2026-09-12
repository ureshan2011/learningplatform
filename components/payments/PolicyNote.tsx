import Link from "next/link";

/**
 * The two policies that govern the money, shown at the moment the money moves.
 *
 * Deliberately a component rather than a line of copy repeated at each call
 * site. A student agreeing to terms they were never shown is the kind of thing
 * that only matters once, in a dispute, and a sentence that has to be
 * remembered at every pay button is a sentence that eventually is not there.
 *
 * English-only, like the pay buttons it sits under. Translating the checkout
 * copy is its own piece of work; half a translated sentence would read worse
 * than a whole untranslated one.
 */
export function PolicyNote({ className = "" }: { className?: string }) {
  return (
    <p className={`max-w-[22rem] text-xs text-ict-ink-300 ${className}`}>
      By paying you agree to the{" "}
      <Link href="/terms" className="underline underline-offset-2">
        Terms
      </Link>{" "}
      and the{" "}
      <Link href="/refund-policy" className="underline underline-offset-2">
        Refund policy
      </Link>
      .
    </p>
  );
}
