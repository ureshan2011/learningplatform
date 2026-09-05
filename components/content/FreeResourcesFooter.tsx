import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

interface ResourceLink {
  href: string;
  label: string;
  icon: IconName;
}

/**
 * Every free, static content page in one place. These pages exist to be
 * found from Google one at a time, which means each one is otherwise an
 * island — a student who lands on /logic-gates from a search has no way to
 * discover /command-words unless something on the page tells them it
 * exists. This is that something, reused identically everywhere so a
 * student learns "the bottom of any free page has the rest of them"
 * instead of every page inventing its own ad-hoc set of links.
 */
const RESOURCES: ResourceLink[] = [
  { href: "/notes", label: "Free ICT notes & past papers", icon: "description" },
  { href: "/past-papers", label: "Past papers, used the right way", icon: "receipt_long" },
  { href: "/syllabus", label: "The full syllabus, unit by unit", icon: "auto_stories" },
  { href: "/revision-plan", label: "A revision plan, especially for repeats", icon: "calendar_month" },
  { href: "/command-words", label: "Exam command words explained", icon: "fact_check" },
  { href: "/distinguish-between", label: "10 worked \"distinguish between\" answers", icon: "rule" },
  { href: "/number-systems", label: "Number systems & two's complement", icon: "memory" },
  { href: "/logic-gates", label: "Logic gates, symbols & truth tables", icon: "hub" },
  { href: "/university-pathways", label: "Where A/L ICT can take you", icon: "school" },
];

/** Pass the current page's own path so it doesn't link to itself. */
export function FreeResourcesFooter({ exclude = [] }: { exclude?: string[] }) {
  const items = RESOURCES.filter((r) => !exclude.includes(r.href));
  if (items.length === 0) return null;

  return (
    <section className="mt-14 rounded-ict-card border border-(--color-awaken-line) bg-(--color-awaken-card) p-6">
      <h2 className="text-lg font-bold">More free A/L ICT resources</h2>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {items.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex items-center gap-2 rounded-ict-md px-3 py-2 text-sm text-(--color-awaken-ink-soft) transition-colors hover:bg-(--color-awaken-bg) hover:text-(--color-awaken-accent)"
            >
              <Icon name={r.icon} className="!text-base text-(--color-awaken-accent)" />
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
