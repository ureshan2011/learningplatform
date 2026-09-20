import Link from "next/link";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
// Every policy page carries the same date, so they are obviously one document
// set — and the same constant is what an account's acceptance is stamped with.
import { POLICY_UPDATED } from "@/lib/legal";

/**
 * Shared shell for the four policy pages a payment gateway expects to find
 * before it will approve a merchant account: terms, privacy, refunds and a
 * way to reach a human.
 *
 * They are ordinary public pages — crawlable, no sign-in — because a reviewer
 * at PayHere, and a parent deciding whether to trust the site, both look for
 * them in the footer and both leave if they are behind a login.
 */
export function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader user={null} />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-ict-fg-soft underline"
        >
          <Icon name="arrow_back" className="!text-base" />
          Home
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-ict-fg-soft">{intro}</p>
        <p className="mt-1 text-xs text-ict-fg-soft">Last updated {POLICY_UPDATED}</p>

        <div className="mt-8 space-y-8">{children}</div>

        <nav className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-ict-line pt-5 text-sm">
          <Link href="/terms" className="text-ict-accent-fg underline">Terms</Link>
          <Link href="/privacy" className="text-ict-accent-fg underline">Privacy</Link>
          <Link href="/refund-policy" className="text-ict-accent-fg underline">Refunds</Link>
          <Link href="/contact" className="text-ict-accent-fg underline">Contact</Link>
        </nav>
      </main>
    </>
  );
}

export function Clause({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold">{heading}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ict-fg-soft">
        {children}
      </div>
    </section>
  );
}

/**
 * A detail only the owner can supply — their address, their registration
 * number — shown in brackets until it is filled in from
 * Teacher → Payments → Bank details & receipt identity.
 *
 * Visible rather than silently omitted on purpose: a policy with an invisible
 * gap gets published with the gap still in it.
 */
export function Blank({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-ict-amber-500/15 px-1 font-medium text-ict-amber-500">
      [{children}]
    </span>
  );
}
