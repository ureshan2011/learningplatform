"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { isJoinableNow, type TopicClass } from "@/lib/content/topic-classes";
import type { ToneColors } from "@/lib/content/unit-visuals";
import { useNow } from "@/components/syllabus/motion";

/**
 * The button that turns a syllabus topic into a class a student can actually
 * sit in.
 *
 * Three honest states, never more:
 *
 * - a class for this topic is joinable right now → straight into it;
 * - one is scheduled → the real date, with a live countdown once hydrated;
 * - none is scheduled yet → the sign-up that gets them into the subject,
 *   labelled as the trial it is rather than pretending a class exists.
 *
 * It grants nothing. `/live/[sessionId]` redirects a signed-out visitor to
 * sign-in and runs `hasAccess()` before it hands over a join URL, so this is
 * only ever a link.
 */
export function ClassCta({
  subjectId,
  topicClass,
  tone,
  size = "md",
}: {
  subjectId: string;
  topicClass?: TopicClass;
  tone: ToneColors;
  size?: "sm" | "md";
}) {
  const now = useNow();
  const small = size === "sm";
  const padding = small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";

  if (!topicClass) {
    return (
      <Link
        href={`/signin?next=/subjects/${subjectId}`}
        className={`group/cta inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold transition-all duration-200 hover:-translate-y-0.5 ${padding}`}
        style={{ borderColor: tone.line, color: tone.ink, background: tone.soft }}
      >
        <Icon name="videocam" className={small ? "!text-sm" : "!text-base"} />
        Join this class
        <Icon
          name="arrow_forward"
          className={`transition-transform duration-200 group-hover/cta:translate-x-0.5 ${small ? "!text-sm" : "!text-base"}`}
        />
      </Link>
    );
  }

  const live = now !== null && isJoinableNow(topicClass, now);

  if (live) {
    return (
      <Link
        href={`/live/${topicClass.id}`}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-(--color-awaken-danger) to-(--color-awaken-rose) font-semibold text-white shadow-[0_6px_18px_rgba(220,38,38,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99] ${padding}`}
      >
        <span className="relative flex size-2 shrink-0">
          <span className="syl-pulse-ring absolute inline-flex size-2 rounded-full bg-white" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        Join live now
      </Link>
    );
  }

  return (
    <Link
      href={`/live/${topicClass.id}`}
      className={`group/cta inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold text-white shadow-[0_6px_18px_rgba(0,0,0,0.12)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99] ${padding}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${tone.gradFrom}, ${tone.gradTo})` }}
    >
      <Icon name="calendar_month" className={small ? "!text-sm" : "!text-base"} />
      Join · {topicClass.startsAtShort}
    </Link>
  );
}

/**
 * The small status line beside a topic: "Live now", "starts in 3 h", or the
 * date. Kept separate from the button so a unit header can show class status
 * without repeating the call to action on every row.
 */
export function ClassStatus({
  topicClass,
  className,
}: {
  topicClass: TopicClass;
  className?: string;
}) {
  const now = useNow();

  if (now === null) {
    // Pre-hydration: the server-formatted label, so the markup matches exactly.
    return <span className={className}>{topicClass.startsAtLabel}</span>;
  }

  if (isJoinableNow(topicClass, now)) {
    return (
      <span className={`font-semibold text-(--color-awaken-danger) ${className ?? ""}`}>
        Live now
      </span>
    );
  }

  return <span className={className}>{countdownLabel(topicClass, now)}</span>;
}

/**
 * "in 4 days · Sat, 30 Aug, 4:00 pm" — the countdown first, since that is what
 * students scan for. Pure arithmetic over a label the server already
 * formatted, so it cannot disagree with the server-rendered markup.
 */
function countdownLabel(topicClass: TopicClass, now: number): string {
  const minutes = Math.round((topicClass.startsAt - now) / 60_000);
  const absolute = topicClass.startsAtLabel;

  if (minutes <= 0) return absolute;
  if (minutes < 60) return `in ${minutes} min · ${absolute}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} h · ${absolute}`;

  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"} · ${absolute}`;
}

/** Pulsing "LIVE" pill for a unit that has a class running right now. */
export function LivePill({ label = "Live now" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-awaken-danger) px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
      <span className="relative flex size-1.5 shrink-0">
        <span className="syl-pulse-ring absolute inline-flex size-1.5 rounded-full bg-white" />
        <span className="relative inline-flex size-1.5 rounded-full bg-white" />
      </span>
      {label}
    </span>
  );
}
