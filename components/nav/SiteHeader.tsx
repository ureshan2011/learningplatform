"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
 * visitor, to stay statically generated for SEO — see the comment on
 * `/notes`. `useSignedInClient` recovers the signed-in nav after hydration
 * whenever a real user wasn't resolved server-side, so the header at least
 * offers a way back into the app rather than a "Sign in" button to someone
 * who already is.
 *
 * This used to be load-bearing: the student sidebar linked straight to those
 * pages, so tapping "Free notes" from a dark rail landed you on a cream page
 * with a guest header and no rail at all. It no longer does — the rail goes to
 * `/library` and `/subjects/{id}/syllabus`, which render inside the app shell.
 * What remains is the real case this was always for: a signed-in student
 * arriving on a public page from a search result or a shared link.
 *
 * It names no palette colour, only role tokens, so it is white on the cream
 * marketing pages and near-black on the free-resource pages, which sit inside
 * `.ict-app` (see `app/(public)/(resources)/layout.tsx`).
 */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const isStaff = user?.role === "teacher" || user?.role === "admin";
  const showSignedInNav = useSignedInClient(Boolean(user));
  const pathname = usePathname();
  // A visitor who taps "Sign in" from an article page should come back to
  // that article, not the dashboard — the same "return to where you were"
  // behaviour every gated page already gets from `requirePageUser`. Skipped
  // on the sign-in page itself and on the payment pages, where "back to
  // here" is never the right destination.
  const skipNext = pathname.startsWith("/signin") || pathname.startsWith("/payments");
  const signInHref = skipNext ? "/signin" : `/signin?next=${encodeURIComponent(pathname)}`;

  return (
    <header className="border-b border-ict-line bg-ict-surface-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href={showSignedInNav ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-ict-orange-500 text-white">
            <Icon name="school" className="!text-lg" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-fg">
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
              <NavLink href="/campus-ready">Campus Ready</NavLink>
              <NavLink href="/syllabus">Syllabus</NavLink>
              <NavLink href="/past-papers">Past papers</NavLink>
              <NavLink href="/notes">Notes</NavLink>
              <NavLink href="/dr-yasas">Lecturer</NavLink>
              <ButtonLink href={signInHref} variant="primary" size="sm" className="ml-1">
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
                <SignOutButton className="rounded-full border-[1.5px] border-ict-line-strong px-4 py-2 text-sm font-semibold text-ict-fg transition-colors duration-[120ms] hover:border-ict-line-strong-hover" />
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
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-medium text-ict-fg-soft transition-colors duration-[120ms] hover:bg-ict-surface-hover hover:text-ict-fg"
    >
      {children}
    </Link>
  );
}
