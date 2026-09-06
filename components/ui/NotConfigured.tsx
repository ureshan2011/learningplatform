import { FEATURE_HINT, FEATURE_LABEL, type Feature } from "@/lib/features";
import { EmptyState } from "@/components/ds";

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
    <EmptyState
      icon="settings"
      title={`${FEATURE_LABEL[feature]} — not set up yet`}
      body={
        forTeacher
          ? `${FEATURE_HINT[feature]} See SETUP.md → Adding features. Everything else keeps working meanwhile.`
          : FEATURE_HINT[feature]
      }
    />
  );
}
