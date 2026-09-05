function Bits({ digits, tone }: { digits: number[]; tone: "neutral" | "accent" }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {digits.map((d, i) => (
        <div
          key={i}
          className={
            "flex size-8 items-center justify-center rounded-ict-md border-2 text-sm font-bold sm:size-9 " +
            (tone === "accent"
              ? "border-(--color-awaken-accent) bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)"
              : "border-(--color-awaken-line) text-(--color-awaken-ink)")
          }
        >
          {d}
        </div>
      ))}
    </div>
  );
}

/**
 * The three-step two's complement recipe — original, invert every bit, add
 * one — with each intermediate value computed from `bits` rather than
 * hand-typed, so invert/add-one can't silently drift out of sync with the
 * original value shown.
 *
 * Stacked vertically rather than side by side: three 8-bit rows side by side
 * overflow a normal content column on any viewport, and a horizontally
 * scrolling diagram is worse than one that simply reads top to bottom.
 */
export function TwosComplementFlow({ bits }: { bits: string }) {
  const original = bits.split("").map(Number);
  const inverted = original.map((d) => (d === 1 ? 0 : 1));

  let carry = 1; // "add one"
  const width = inverted.length;
  const added = new Array(width).fill(0);
  for (let i = width - 1; i >= 0; i--) {
    const total = inverted[i] + carry;
    added[i] = total % 2;
    carry = total >= 2 ? 1 : 0;
  }

  const steps: Array<{ label: string; digits: number[]; accent?: boolean }> = [
    { label: "Original", digits: original },
    { label: "Invert every bit", digits: inverted },
    { label: "Add 1", digits: added, accent: true },
  ];

  return (
    <div className="not-prose">
      <div className="flex flex-col items-center gap-2 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
        {steps.map((step, i) => (
          <div key={step.label} className="flex w-full flex-col items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-(--color-awaken-ink-soft) uppercase tracking-wide">
                {step.label}
              </span>
              <Bits digits={step.digits} tone={step.accent ? "accent" : "neutral"} />
            </div>
            {i < steps.length - 1 ? (
              <span className="my-1 text-xl text-(--color-awaken-ink-soft)" aria-hidden>
                ↓
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
