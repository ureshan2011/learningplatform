import clsx from "clsx";

/**
 * The Campus Ready mark.
 *
 * ## What it is
 *
 * Three ascending bars with a chevron rising off the tallest. It has to carry
 * two ideas at once, because the product does: the bars are the data analytics
 * the programme actually teaches, and the ascent is the thing it is sold on —
 * a student going up, from school to campus, during a year that would
 * otherwise be spent waiting.
 *
 * ## Why it looks like this
 *
 * Campus Ready is a sub-brand of ICT Campus, not a separate company, so the
 * mark is built from the same vocabulary as the rest of the system rather than
 * a new one: 2px round-capped strokes on a 32 grid, matching the Lucide set
 * behind `components/ui/Icon.tsx`, and no fills, no gradients.
 *
 * Colour is rationed the way every other screen rations it. The two baseline
 * bars and the rule under them are ink and inherit `currentColor`, so the mark
 * works unchanged on cream and on near-black. Only the rising element — the
 * tallest bar and its chevron — is orange, and it reads as one thing, not two.
 *
 * It is drawn to survive 24px in a nav bar: three strokes, one arrow, nothing
 * that closes up when the whole glyph is smaller than a fingernail.
 */
export function CampusReadyMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={clsx("shrink-0", className)}
    >
      <g
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      >
        <path d="M6 26h20" opacity={0.4} />
        <path d="M10.5 26v-6" />
        <path d="M16 26v-10" />
      </g>
      <g
        className="text-ict-orange-500"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.5 26V14" />
        <path d="M17.5 10.5 21.5 6.5l4 4" />
      </g>
    </svg>
  );
}

/**
 * Mark plus wordmark.
 *
 * The wordmark stays a single ink weight and lets the mark carry the only
 * colour, per the one-orange-thing-per-region rule. Sentence case, because the
 * system's only uppercase is `Eyebrow`.
 */
export function CampusReadyLogo({
  size = 32,
  className,
  wordmarkClassName,
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <CampusReadyMark size={size} />
      <span
        className={clsx(
          "font-display font-extrabold tracking-[-0.02em]",
          wordmarkClassName ?? "text-xl",
        )}
      >
        Campus Ready
      </span>
    </span>
  );
}
