import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Card, SectionHeading } from "@/components/ds";

interface CampusLink {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * The closing link block for every page about the move from A/Ls to
 * university — the Campus Ready cluster's twin of `FreeResourcesFooter`.
 *
 * Kept separate on purpose. A student who has just got their results does not
 * want "More free A/L ICT resources"; they want the next question answered —
 * what a Z-score is, what last year's cut-off was, how the UGC form works. And
 * a search engine reads which pages link to which as a statement of what the
 * site is about: the A/L ICT pages link among themselves, these link among
 * themselves, and the two clusters meet at `/university-pathways` and at the
 * single Campus Ready row `FreeResourcesFooter` already carries.
 */
const LINKS: CampusLink[] = [
  { href: "/after-al", label: "After A/L — what to do while you wait", icon: "route" },
  { href: "/university-pathways#check", label: "Free checker — last round's cut-offs in your district", icon: "search" },
  { href: "/campus-match", label: "Campus Match — your chance at every course", icon: "insights" },
  { href: "/campus/academic-email", label: "How to email a lecturer", icon: "mail" },
  { href: "/campus-survival-pack", label: "Campus Survival Pack — templates and guides", icon: "download" },
];

/** Pass the current page's own path so it doesn't link to itself. */
export function CampusFooter({ exclude = [] }: { exclude?: string[] }) {
  const items = LINKS.filter((l) => !exclude.includes(l.href.split("#")[0]));

  return (
    <Card radius="card" className="mt-14 p-6">
      <SectionHeading as="h2" className="!text-lg">
        More for the move to university
      </SectionHeading>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {items.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center gap-2 rounded-ict-md px-3 py-2 text-sm text-ict-fg-soft transition-colors duration-[120ms] hover:bg-ict-surface-hover hover:text-ict-accent-fg"
            >
              <Icon name={l.icon} className="!text-base text-ict-fg-mute" />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      {exclude.includes("/campus-ready") ? null : (
        <Link
          href="/campus-ready"
          className="mt-5 flex items-center gap-3 rounded-ict-md border border-ict-line px-3.5 py-3 transition-colors duration-[120ms] hover:border-ict-line-strong-hover hover:bg-ict-surface-hover"
        >
          <Icon name="north_east" className="!text-base shrink-0 text-ict-orange-500" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ict-fg">
              Campus Ready — a 12-week course for the wait
            </span>
            <span className="block text-xs text-ict-fg-mute">
              Excel, Python, statistics, referencing and honest use of AI, in Sinhala. Paid, two
              intakes a year.
            </span>
          </span>
        </Link>
      )}
    </Card>
  );
}
