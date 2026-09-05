function Row({
  label,
  bits,
  muted,
  leadingSpacer,
}: {
  label: string;
  bits: number[];
  muted?: boolean;
  leadingSpacer?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 text-right text-xs font-semibold text-(--color-awaken-ink-soft)">{label}</span>
      <div className="flex gap-1">
        {leadingSpacer ? <div className="size-8 sm:size-9" aria-hidden /> : null}
        {bits.map((d, i) => (
          <div
            key={i}
            className={
              "flex size-8 items-center justify-center rounded-md text-sm font-bold sm:size-9 " +
              (muted
                ? "text-(--color-awaken-ink-soft)"
                : "border-2 border-(--color-awaken-accent) bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)")
            }
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Column binary addition with the carry row shown explicitly — computed bit
 * by bit from `a` and `b` (equal length), so the worked example is always
 * arithmetically correct by construction rather than hand-verified.
 */
export function BinaryAddition({ a, b }: { a: string; b: string }) {
  if (a.length !== b.length) throw new Error("BinaryAddition requires equal-length operands");
  const width = a.length;
  const aBits = a.split("").map(Number);
  const bBits = b.split("").map(Number);

  const sumBits: number[] = new Array(width).fill(0);
  const carryIn: number[] = new Array(width).fill(0);
  let carry = 0;
  for (let i = width - 1; i >= 0; i--) {
    carryIn[i] = carry;
    const total = aBits[i] + bBits[i] + carry;
    sumBits[i] = total % 2;
    carry = total >= 2 ? 1 : 0;
  }
  const carriedOut = carry === 1;
  const resultBits = carriedOut ? [1, ...sumBits] : sumBits;

  return (
    <div className="not-prose overflow-x-auto">
      <div className="inline-flex min-w-full flex-col gap-2 rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
        <Row label="carry" bits={carryIn} muted leadingSpacer={carriedOut} />
        <Row label="" bits={aBits} muted leadingSpacer={carriedOut} />
        <div className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-right text-lg font-bold text-(--color-awaken-ink-soft)">+</span>
          <div className="flex gap-1">
            {carriedOut ? <div className="size-8 sm:size-9" aria-hidden /> : null}
            {bBits.map((d, i) => (
              <div key={i} className="flex size-8 items-center justify-center rounded-md text-sm font-bold text-(--color-awaken-ink-soft) sm:size-9">
                {d}
              </div>
            ))}
          </div>
        </div>
        <div className="ml-6 h-0.5 rounded-full bg-(--color-awaken-ink)" style={{ width: `${width * 2.5}rem` }} />
        <Row label="=" bits={resultBits} />
      </div>
    </div>
  );
}
