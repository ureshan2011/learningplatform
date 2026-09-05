/**
 * A binary number as a place-value chart: one chip per bit, its power-of-2
 * weight above it, and the running total below — computed from `bits`
 * itself, not hand-typed, so the diagram can never disagree with the answer
 * quoted in the surrounding prose.
 */
export function PlaceValueChart({ bits }: { bits: string }) {
  const digits = bits.split("").map((d) => Number(d));
  const width = digits.length;
  const total = digits.reduce((sum, d, i) => sum + d * 2 ** (width - 1 - i), 0);

  return (
    <div className="not-prose overflow-x-auto">
      <div className="inline-flex min-w-full items-end justify-center gap-1.5 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
        {digits.map((d, i) => {
          const place = 2 ** (width - 1 - i);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-semibold text-(--color-awaken-ink-soft)">{place}</span>
              <div
                className={
                  "flex size-10 items-center justify-center rounded-ict-md border-2 text-lg font-bold sm:size-12 " +
                  (d === 1
                    ? "border-(--color-awaken-accent) bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)"
                    : "border-(--color-awaken-line) text-(--color-awaken-ink-soft)")
                }
              >
                {d}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-(--color-awaken-ink-soft)">
        Add only the highlighted place values:{" "}
        <span className="font-semibold text-(--color-awaken-ink)">
          {digits
            .map((d, i) => (d === 1 ? 2 ** (width - 1 - i) : null))
            .filter((v): v is number => v !== null)
            .join(" + ")}{" "}
          = {total}
        </span>
      </p>
    </div>
  );
}
