"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";

const TABS: Array<{ segment: string; label: string; icon: IconName }> = [
  { segment: "", label: "Overview", icon: "grid_view" },
  { segment: "/practice", label: "Practice", icon: "quiz" },
  { segment: "/mock-exams", label: "Mock exams", icon: "schedule" },
  { segment: "/lab", label: "Code Lab", icon: "code" },
  { segment: "/certificate", label: "Certificate", icon: "military_tech" },
];

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
export function SubjectTabs({ subjectId, locked }: { subjectId: string; locked?: boolean }) {
  const pathname = usePathname();
  const base = `/subjects/${subjectId}`;

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex items-center gap-1 rounded-full bg-ict-ink-850 p-1">
        {TABS.map((tab) => {
          const href = `${base}${tab.segment}`;
          const active = pathname === href;
          // Overview stays reachable when locked — it is the page that explains
          // what is missing and how to unlock it.
          const disabled = locked && tab.segment !== "";

          if (disabled) {
            return (
              <span
                key={tab.segment}
                aria-disabled
                title="Subscribe to unlock"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-ict-ink-500"
              >
                <Icon name="lock" className="!text-[13px]" />
                {tab.label}
              </span>
            );
          }

          return (
            <Link
              key={tab.segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-[120ms] ease-ict",
                active
                  ? "bg-ict-orange-500 text-white"
                  : "text-ict-ink-300 hover:bg-ict-ink-800 hover:text-ict-paper-50",
              )}
            >
              <Icon name={tab.icon} className="!text-[15px]" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
