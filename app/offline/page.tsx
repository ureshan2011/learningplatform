import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "You are offline",
  // Nothing here is worth a search result, and a cached shell page that ranks
  // would be actively confusing.
  robots: { index: false, follow: false },
};

/**
 * What a student sees when a page cannot be reached.
 *
 * Precached by the service worker at install, and served for any navigation
 * that fails — a dropped connection on a bus, the thirty seconds between two
 * cell towers, a phone with no data left in the month. The alternative is
 * Chrome's dinosaur, which does not say whether the site is down or the
 * connection is, and offers nothing to do next.
 *
 * Statically rendered on purpose: it has to exist as one fixed HTML file the
 * worker can store, so it reads no session and names no student. The two links
 * are ordinary navigations — they fail the same way if the connection is still
 * gone, which is the honest behaviour; this page cannot invent content it does
 * not have, and it does not pretend otherwise.
 *
 * Scoped `.ict-app` so it matches the signed-in world, which is where a
 * student almost always is when this appears.
 */
export default function OfflinePage() {
  return (
    <div className="ict-app flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px] text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ict-surface-raised text-ict-fg-mute">
          <Icon name="sensors" className="!text-2xl" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-fg">
          No connection
        </h1>
        <p className="mt-2 text-sm text-ict-fg-soft">
          ICT Campus is still here — your phone cannot reach it right now. Anything you had already
          opened will load again the moment you are back.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className="ict-press inline-flex h-10 items-center rounded-full bg-ict-orange-500 px-5 text-sm font-semibold text-white transition-colors duration-[120ms] ease-ict hover:bg-ict-orange-600"
          >
            Try again
          </Link>
          <Link
            href="/classes"
            className="ict-press inline-flex h-10 items-center rounded-full border-[1.5px] border-ict-line-strong px-5 text-sm font-semibold text-ict-fg transition-colors duration-[120ms] ease-ict hover:border-ict-line-strong-hover"
          >
            My classes
          </Link>
        </div>
      </div>
    </div>
  );
}
