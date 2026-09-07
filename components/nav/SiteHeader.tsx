"use client";

import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { useSignedInClient } from "@/lib/auth/use-signed-in-client";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ds-cream";

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
 * visitor, to stay statically generated for SEO — see the comment on
 * `/notes`. Left alone, that makes a signed-in student who taps one of
 * those links from their own dashboard sidebar land on a page whose header
 * still offers "Sign in" and has no way back except the browser's back
 * button. `useSignedInClient` recovers the signed-in nav after hydration
 * whenever a real user wasn't resolved server-side.
 */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const isStaff = user?.role === "teacher" || user?.role === "admin";
  const showSignedInNav = useSignedInClient(Boolean(user));

  return (
    <header className="border-b border-ict-paper-300 bg-ict-paper-0">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href={showSignedInNav ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-ict-orange-500 text-white">
            <Icon name="school" className="!text-lg" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-ink-900">
            ICT<span className="text-ict-orange-500">Campus</span>
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
                <SignOutButton className="rounded-full border-[1.5px] border-ict-ink-900 px-4 py-2 text-sm font-semibold text-ict-ink-900 transition-colors duration-[120ms] hover:border-ict-orange-500 hover:text-ict-orange-600" />
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
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-medium text-ict-ink-500 transition-colors duration-[120ms] hover:bg-ict-paper-100 hover:text-ict-ink-900"
    >
      {children}
    </Link>
  );
}
