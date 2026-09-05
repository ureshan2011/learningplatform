import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ds";

/**
 * The one navigation bar every page (other than the landing hero, which has
 * its own marketing header) shares — same wordmark, same colours, same link
 * placement. Consistency here is what makes "discover a feature" mean
 * "look at the top of the page" for every role, instead of every page
 * inventing its own way back.
 *
 * Server component: role comes from the session already resolved by the
 * calling page, so this adds no extra Firestore read.
 */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const isStaff = user?.role === "teacher" || user?.role === "admin";

  return (
    <header className="border-b border-(--color-awaken-line) bg-(--color-awaken-card)">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) text-white">
            <Icon name="school" className="!text-lg" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
            ICT<span className="text-(--color-awaken-accent)">Campus</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {!user ? (
            <>
              {/* Guest nav doubles as the site's internal link graph: every
                  public page links to the two pages that carry the commercial
                  and the highest-volume informational query. */}
              <NavLink href="/al-ict-classes">Classes</NavLink>
              <NavLink href="/syllabus">Syllabus</NavLink>
              <NavLink href="/past-papers">Past papers</NavLink>
              <NavLink href="/notes">Free notes</NavLink>
              <ButtonLink href="/signin" variant="primary" size="sm" className="ml-1">
                Sign in
              </ButtonLink>
            </>
          ) : (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/syllabus">Syllabus</NavLink>
              {isStaff ? <NavLink href="/teacher">Teacher console</NavLink> : null}
              <NavLink href="/account">Account</NavLink>
              <div className="ml-1">
                <SignOutButton className="rounded-full border border-(--color-awaken-line) px-4 py-2 text-sm font-medium transition-colors hover:border-(--color-awaken-accent)/40" />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 font-medium text-(--color-awaken-ink-soft) transition-colors hover:bg-(--color-awaken-bg) hover:text-(--color-awaken-ink)"
    >
      {children}
    </Link>
  );
}
