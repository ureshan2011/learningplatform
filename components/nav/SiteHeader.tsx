"use client";

import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { useSignedInClient } from "@/lib/auth/use-signed-in-client";
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
 * `user` usually comes from the session already resolved by the calling
 * page. Several free-resource pages (`/notes`, `/past-papers`,
 * `/command-words`, ...) pass `null` on purpose even to a signed-in
 * visitor, to stay statically generated for SEO rather than reading the
 * session per request — see the comment on `/notes`. Left alone, that
 * makes a signed-in student who taps one of those links from their own
 * dashboard sidebar land on a page whose header still offers "Sign in" and
 * has no way back except the browser's back button. This client-side
 * check recovers the signed-in nav from Firebase's locally persisted auth
 * state after the first paint — no extra network round trip, and no
 * hydration mismatch, since the guest nav still renders first to match
 * the cached HTML.
 */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const isStaff = user?.role === "teacher" || user?.role === "admin";
  const showSignedInNav = useSignedInClient(Boolean(user));

  return (
    <header className="border-b border-(--color-awaken-line) bg-(--color-awaken-card)">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href={showSignedInNav ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) text-white">
            <Icon name="school" className="!text-lg" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
            ICT<span className="text-(--color-awaken-accent)">Campus</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {!showSignedInNav ? (
            <>
              {/* Guest nav doubles as the site's internal link graph: every
                  public page links to the two pages that carry the commercial
                  and the highest-volume informational query. */}
              <NavLink href="/al-ict-classes">Classes</NavLink>
              <NavLink href="/syllabus">Syllabus</NavLink>
              <NavLink href="/past-papers">Past papers</NavLink>
              <NavLink href="/notes">Notes</NavLink>
              <NavLink href="/dr-yasas">Lecturer</NavLink>
              <ButtonLink href="/signin" variant="primary" size="sm" className="ml-1">
                Sign in
              </ButtonLink>
            </>
          ) : (
            <>
              <NavLink href="/dashboard">
                <Icon name="arrow_back" className="!text-sm" /> Back to dashboard
              </NavLink>
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
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-medium text-(--color-awaken-ink-soft) transition-colors hover:bg-(--color-awaken-bg) hover:text-(--color-awaken-ink)"
    >
      {children}
    </Link>
  );
}
