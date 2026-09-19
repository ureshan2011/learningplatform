"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * `free` marks a tab that stays open to a student who has not subscribed.
 * Only the syllabus is: it is public on the marketing site too, so locking it
 * behind a subscription here would be the same page refusing to open for
 * someone who can read it while signed out.
 */
const TAB_ORDER: Array<{ segment: string; key: TabKey; icon: IconName; free?: true }> = [
  { segment: "", key: "overview", icon: "grid_view" },
  { segment: "/practice", key: "practice", icon: "quiz" },
  { segment: "/mock-exams", key: "mockExams", icon: "schedule" },
  { segment: "/predicted-paper", key: "predictedPaper", icon: "auto_awesome" },
  { segment: "/lab", key: "codeLab", icon: "code" },
  { segment: "/syllabus", key: "syllabus", icon: "auto_stories", free: true },
  { segment: "/certificate", key: "certificate", icon: "military_tech" },
];

/** Labels are passed in rather than looked up: this renders on the client, and the
 *  dictionary lives on the server. */
type TabKey =
  | "overview"
  | "practice"
  | "mockExams"
  | "predictedPaper"
  | "codeLab"
  | "syllabus"
  | "certificate";
export type TabLabels = Record<TabKey, string>;

/**
 * The subject's own navigation, on every page inside it.
 *
 * A subject is five screens, and until now four of them could only be reached
 * from a list on the overview page — so opening Practice and then wanting Mock
 * exams meant going back, finding the sidebar card, and reading it again. These
 * are peers; they should be a row of tabs, and the current one should be
 * obvious.
 *
 * A pill row on a sunken track, per the system. It scrolls horizontally on
 * narrow screens rather than wrapping, so the shape stays the same everywhere
 * and the tabs never reflow under a thumb.
 */
export function SubjectTabs({
  subjectId,
  locked,
  labels,
}: {
  subjectId: string;
  locked?: boolean;
  labels: TabLabels;
}) {
  const pathname = usePathname();
  const base = `/subjects/${subjectId}`;

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex items-center gap-1 rounded-full bg-ict-ink-850 p-1">
        {TAB_ORDER.map((tab) => {
          const href = `${base}${tab.segment}`;
          // The syllabus has a page per unit beneath it, and the tab should
          // stay lit while a student is reading one.
          const active = tab.segment === "/syllabus" ? pathname.startsWith(href) : pathname === href;
          // Overview stays reachable when locked — it is the page that explains
          // what is missing and how to unlock it.
          const disabled = locked && tab.segment !== "" && !tab.free;

          if (disabled) {
            return (
              <span
                key={tab.segment}
                aria-disabled
                title="Subscribe to unlock"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-ict-ink-500"
              >
                <Icon name="lock" className="!text-sm" />
                {labels[tab.key]}
              </span>
            );
          }

          return (
            <Link
              key={tab.segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors duration-[120ms] ease-ict",
                active
                  ? "bg-ict-orange-500 text-white"
                  : "text-ict-ink-300 hover:bg-ict-ink-800 hover:text-ict-paper-50",
              )}
            >
              <Icon name={tab.icon} className="!text-sm" />
              {labels[tab.key]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
