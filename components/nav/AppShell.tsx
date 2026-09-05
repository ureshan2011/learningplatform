"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Avatar, ButtonLink } from "@/components/ds";
import { SignOutButton } from "@/components/auth/SignOutButton";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Small orange count on the right of the row — unread, pending, waiting. */
  count?: number;
  /** Match `/teacher/payments/anything` as well as the exact path. */
  matchPrefix?: boolean;
}

export interface NavGroup {
  /** Omitted on the first group — a label above the primary items is noise. */
  label?: string;
  items: NavItem[];
}

export interface ShellPromo {
  title: string;
  body: string;
  href: string;
  cta: string;
}

/**
 * The shell every signed-in screen sits in.
 *
 * ## Why this exists
 *
 * The app had two navigation systems and neither led anywhere. Students got a
 * sidebar with four links — Dashboard, Free notes, Command words, Account —
 * while Practice, Mock exams, the Code Lab and the syllabus were reachable only
 * by going to the dashboard, opening a subject, and finding them in a sidebar
 * card. Three clicks, no signpost, and nothing in the navigation ever hinted
 * they existed. The teacher console was worse: one long page with five pill
 * buttons wrapping across the top and no persistent nav at all, so every
 * sub-screen was a dead end with a "back to console" link.
 *
 * So this is one shell, one mental model, for students and staff alike: every
 * destination the role can reach is in the sidebar, always, whatever screen
 * they are on.
 *
 * ## Layout
 *
 * Desktop is the design system's product archetype — a fixed 232px dark rail
 * with the wordmark on top, grouped nav, and a promo card pinned to the bottom.
 *
 * Mobile is **not** that rail behind a hamburger. This audience is on phones,
 * and a menu nobody opens is a menu that does not exist, which is how the deep
 * features got lost in the first place. The five most-used destinations become
 * a bottom tab bar sitting in the thumb's arc; everything else lives behind
 * "More", which opens the full rail as a sheet.
 */
export function AppShell({
  groups,
  mobileTabs,
  user,
  promo,
  topbarRight,
  languageToggle,
  labels,
  children,
}: {
  groups: NavGroup[];
  /** Up to four; "More" is appended automatically as the fifth. */
  mobileTabs: NavItem[];
  user: { name: string; role: string };
  promo?: ShellPromo;
  topbarRight?: React.ReactNode;
  /** Rendered above the account block, in the rail — so it is reachable from every screen. */
  languageToggle?: React.ReactNode;
  labels: { menu: string; more: string; yourAccount: string; signOut: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // The drawer must close when a link inside it navigates. This component sits
  // above `children` and survives route changes, so the state is adjusted
  // during render rather than in an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  const isActive = (item: NavItem) =>
    item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href;

  return (
    <div className="ict-app min-h-dvh md:flex">
      {/* ---------------------------------------------------------------- */}
      {/* Mobile top bar                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ict-border-dark bg-ict-ink-900/85 px-4 py-3 backdrop-blur-[14px] md:hidden">
        <Wordmark />
        <div className="flex items-center gap-2">{topbarRight}</div>
      </div>

      {/* Scrim behind the mobile sheet. */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[rgba(14,12,11,0.62)] md:hidden"
        />
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* The rail — sidebar on desktop, bottom sheet on mobile             */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-ict-panel border-t border-ict-border-dark bg-ict-ink-900 transition-transform duration-[340ms] ease-ict-out",
          "md:sticky md:inset-auto md:top-0 md:h-dvh md:max-h-none md:w-[232px] md:shrink-0 md:translate-y-0 md:rounded-none md:border-t-0 md:border-r",
          menuOpen ? "translate-y-0" : "translate-y-full md:translate-y-0",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-1 md:pb-5">
          <span className="hidden md:block">
            <Wordmark />
          </span>
          <span className="font-display text-base font-extrabold text-ict-paper-50 md:hidden">{labels.menu}</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-full text-ict-ink-300 hover:bg-ict-ink-800 md:hidden"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {groups.map((group, i) => (
            <div key={group.label ?? i} className={i === 0 ? "" : "mt-5"}>
              {group.label ? (
                <p className="mb-1.5 px-3.5 text-xs font-bold uppercase tracking-[0.14em] text-ict-ink-400">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <RailLink key={item.href + item.label} item={item} active={isActive(item)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {promo ? (
          <div className="px-3 pb-3">
            <div className="relative overflow-hidden rounded-ict-card bg-ict-orange-500 p-4">
              {/* The one radial the system allows on a brand surface — a
                  spotlight, not a gradient fill. */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 90% at 80% 0%, rgba(255,255,255,.16), transparent 60%)",
                }}
              />
              <div className="relative">
                <p className="font-display text-base font-extrabold leading-tight text-white">{promo.title}</p>
                <p className="mt-1 text-sm leading-snug text-white/80">{promo.body}</p>
                <ButtonLink href={promo.href} variant="secondary" size="sm" arrow="right" className="mt-3">
                  {promo.cta}
                </ButtonLink>
              </div>
            </div>
          </div>
        ) : null}

        {languageToggle ? (
          <div className="border-t border-ict-border-dark px-3 py-3">{languageToggle}</div>
        ) : null}

        <div className="border-t border-ict-border-dark p-3">
          <Link
            href="/account"
            className="flex items-center gap-3 rounded-full px-2 py-2 transition-colors duration-[120ms] hover:bg-ict-ink-800"
          >
            <Avatar name={user.name} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ict-paper-50">
                {user.name || labels.yourAccount}
              </span>
              <span className="block truncate text-xs capitalize text-ict-ink-400">{user.role}</span>
            </span>
          </Link>
          <SignOutButton
            label={labels.signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-full px-3.5 py-2 text-sm font-semibold text-ict-ink-300 transition-colors duration-[120ms] hover:bg-ict-ink-800 hover:text-ict-paper-50"
          />
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Content                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 hidden items-center gap-4 border-b border-ict-border-dark bg-ict-ink-900/85 px-6 py-3 backdrop-blur-[14px] md:flex">
          <div className="ml-auto flex items-center gap-2">{topbarRight}</div>
        </div>

        {/* Bottom padding clears the mobile tab bar. */}
        <div className="pb-24 md:pb-0">{children}</div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile tab bar                                                    */}
      {/* ---------------------------------------------------------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-ict-border-dark bg-ict-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[14px] md:hidden">
        {mobileTabs.slice(0, 4).map((item) => (
          <TabLink key={item.href + item.label} item={item} active={isActive(item)} />
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-ict-ink-300"
        >
          <Icon name="menu" className="!text-xl" />
          <span className="text-[11px] font-semibold">{labels.more}</span>
        </button>
      </nav>
    </div>
  );
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-10 items-center gap-3 rounded-full px-3.5 text-sm font-semibold transition-colors duration-[120ms] ease-ict",
        active
          ? "bg-ict-ink-700 text-ict-paper-50"
          : "text-ict-ink-300 hover:bg-ict-ink-800 hover:text-ict-paper-50",
      )}
    >
      <Icon name={item.icon} className={clsx("!text-lg", active ? "text-ict-orange-400" : "")} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.count ? (
        <span className="text-xs font-bold text-ict-orange-400">{item.count}</span>
      ) : null}
    </Link>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "relative flex flex-1 flex-col items-center gap-1 px-1 py-2.5",
        active ? "text-ict-orange-400" : "text-ict-ink-300",
      )}
    >
      <span className="relative">
        <Icon name={item.icon} className="!text-xl" />
        {item.count ? (
          <span className="absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full bg-ict-orange-500 px-1 text-[9px] font-bold text-white">
            {item.count}
          </span>
        ) : null}
      </span>
      <span className="max-w-full truncate text-[11px] font-semibold">{item.label}</span>
    </Link>
  );
}

function Wordmark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-ict-sm bg-ict-orange-500 text-white">
        <Icon name="school" className="!text-lg" />
      </span>
      <span className="font-display text-base font-extrabold tracking-[-0.02em] text-ict-paper-50">
        ICT<span className="text-ict-orange-500">CAMPUS</span>
      </span>
    </Link>
  );
}
