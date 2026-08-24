import { FEATURE_HINT, FEATURE_LABEL, type Feature } from "@/lib/features";

/**
 * Shown where a feature would be if its service were connected.
 *
 * The platform is designed to be stood up one service at a time, so "not set up
 * yet" is a normal state, not an error. Saying so plainly beats an empty area
 * that looks broken — and the teacher-facing variant names the next step.
 */
export function NotConfigured({
  feature,
  forTeacher = false,
}: {
  feature: Feature;
  forTeacher?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-5 text-sm">
      <p className="font-medium text-white/80">{FEATURE_LABEL[feature]} — not set up yet</p>
      <p className="mt-1.5 text-white/55">{FEATURE_HINT[feature]}</p>
      {forTeacher ? (
        <p className="mt-3 text-xs text-white/40">
          See SETUP.md → Adding features. Everything else keeps working meanwhile.
        </p>
      ) : null}
    </div>
  );
}
