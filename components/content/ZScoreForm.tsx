import districtData from "@/lib/content/ugc/districts.json";
import streamData from "@/lib/content/ugc/streams.json";

/**
 * "I have my Z-score — what can it reach?" as a plain GET form into the free
 * checker. No client JavaScript: the checker reads `z`, `d` and `s` from the
 * URL on load, so submitting this lands the student on their results. It is
 * the same hand-off a shared checker link makes.
 */
export function ZScoreForm({
  labels = {
    z: "Your Z-score",
    district: "District",
    stream: "Stream",
    choose: "Choose",
    submit: "See my courses",
  },
}: {
  labels?: { z: string; district: string; stream: string; choose: string; submit: string };
}) {
  const field =
    "mt-1.5 h-11 w-full rounded-full border border-ict-line bg-ict-surface px-4 text-sm text-ict-fg outline-none transition-colors duration-[120ms] focus:border-ict-orange-500";

  return (
    <form action="/university-pathways#check" method="get" className="grid gap-4 sm:grid-cols-3">
      <label className="block text-xs font-semibold text-ict-fg-mute">
        {labels.z}
        <input
          name="z"
          type="number"
          inputMode="decimal"
          step="0.0001"
          min={streamData.zScoreRange.min}
          max={streamData.zScoreRange.max}
          required
          placeholder="1.2345"
          className={field}
        />
      </label>
      <label className="block text-xs font-semibold text-ict-fg-mute">
        {labels.district}
        <select name="d" required defaultValue="" className={field}>
          <option value="" disabled>
            {labels.choose}
          </option>
          {districtData.districts.map((d) => (
            <option key={d.key} value={d.key}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-ict-fg-mute">
        {labels.stream}
        <select name="s" required defaultValue="" className={field}>
          <option value="" disabled>
            {labels.choose}
          </option>
          {streamData.streams.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-3">
        <button
          type="submit"
          className="ict-press inline-flex h-10 items-center rounded-full bg-ict-orange-500 px-5 text-sm font-semibold text-white shadow-ict-brand transition-colors duration-[120ms] ease-ict hover:bg-ict-orange-600"
        >
          {labels.submit}
        </button>
      </div>
    </form>
  );
}
