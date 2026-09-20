/**
 * A 6px mastery track, coloured by how well a topic is going: red below 50%,
 * orange to 70%, green above.
 *
 * Deliberately *not* `ProgressBar` from `components/ds/`, and deliberately no
 * longer named the same thing. That one is flat orange, because on a student's
 * screen a progress bar measures how far through something they are and the
 * colour would mean nothing. This one is on the teacher's insights screen,
 * where the colour is the point — it is how a row of fourteen topics shows
 * which two need a class spending on them. Six pixels of semantic colour is a
 * status dot's worth, not the large fill rule 4 rules out.
 */
export function MasteryBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color =
    clamped >= 70
      ? "bg-ict-green-500"
      : clamped >= 50
        ? "bg-ict-orange-500"
        : "bg-ict-red-500";

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-ict-line"
    >
      <div className={`h-full rounded-full transition-[width] ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
