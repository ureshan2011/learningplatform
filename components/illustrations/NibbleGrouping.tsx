/**
 * Splits an 8/12/16-bit binary string into 4-bit nibbles and shows each
 * nibble's hex digit directly underneath it — the actual technique the
 * syllabus teaches for binary↔hex conversion. The hex digits are computed
 * from `bits`, never hand-typed.
 */
export function NibbleGrouping({ bits }: { bits: string }) {
  if (bits.length % 4 !== 0) {
    throw new Error("NibbleGrouping requires a bit length that is a multiple of 4");
  }
  const nibbles: string[] = [];
  for (let i = 0; i < bits.length; i += 4) nibbles.push(bits.slice(i, i + 4));
  const hex = nibbles.map((n) => parseInt(n, 2).toString(16).toUpperCase()).join("");

  return (
    <div className="not-prose overflow-x-auto">
      <div className="inline-flex min-w-full flex-wrap items-start justify-center gap-3 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
        {nibbles.map((nibble, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1">
              {nibble.split("").map((d, j) => (
                <div
                  key={j}
                  className="flex size-9 items-center justify-center rounded-ict-md border-2 border-(--color-awaken-line) text-base font-bold sm:size-10"
                >
                  {d}
                </div>
              ))}
            </div>
            <span className="text-(--color-awaken-ink-soft)">↓</span>
            <div className="flex size-9 items-center justify-center rounded-ict-md border-2 border-(--color-awaken-accent) bg-(--color-awaken-accent-soft) text-base font-bold text-(--color-awaken-accent) sm:size-10">
              {parseInt(nibble, 2).toString(16).toUpperCase()}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-(--color-awaken-ink-soft)">
        Read the hex digits left to right:{" "}
        <span className="font-semibold text-(--color-awaken-ink)">0x{hex}</span>
      </p>
    </div>
  );
}
