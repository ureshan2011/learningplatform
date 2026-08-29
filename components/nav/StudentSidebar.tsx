"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/notes", label: "Free notes", icon: "description" },
  { href: "/command-words", label: "Command words", icon: "auto_stories" },
  { href: "/account", label: "Account", icon: "account_circle" },
];

/**
 * Persistent left sidebar for the whole signed-in student area — replaces the
 * old per-page top bar there. Public pages, the payment flow and the teacher
 * console keep the top nav (SiteHeader); this is scoped to app/(student).
 *
 * Client component because the mobile drawer needs to close itself on
 * navigation, which means watching the pathname.
 */
export function StudentSidebar({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isStaff = role === "teacher" || role === "admin";

  // Close the mobile drawer on navigation. This layout persists across route
  // changes (it lives above `children`, not inside it), so the checkbox-free
  // way to react to a prop-like change is adjusting state during render
  // rather than in an effect — see https://react.dev/learn/you-might-not-need-an-effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const firstName = name.split(" ")[0] ?? name;
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <div className="flex items-center justify-between border-b border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-3 md:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-(--color-awaken-ink-soft) hover:bg-(--color-awaken-bg)"
        >
          <Icon name="menu" />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      ) : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-(--color-awaken-line) bg-(--color-awaken-card) transition-transform duration-200",
          "md:sticky md:top-0 md:h-screen md:w-64 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="hidden px-5 pt-5 md:block">
          <Wordmark />
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {STUDENT_NAV.map((item) => (
            <SidebarLink key={item.href} item={item} active={pathname === item.href} />
          ))}
          {isStaff ? (
            <>
              <div className="my-3 border-t border-(--color-awaken-line)" />
              <SidebarLink
                item={{ href: "/teacher", label: "Teacher console", icon: "workspace_premium" }}
                active={pathname.startsWith("/teacher")}
              />
            </>
          ) : null}
        </nav>

        <div className="border-t border-(--color-awaken-line) p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-awaken-accent-soft) text-sm font-bold text-(--color-awaken-accent)">
              {initial}
            </span>
            <span className="min-w-0 truncate text-sm font-semibold">{firstName}</span>
          </div>
          <div className="mt-1">
            <SignOutButton className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-(--color-awaken-ink-soft) hover:bg-(--color-awaken-bg) hover:text-(--color-awaken-ink)" />
          </div>
        </div>
      </aside>
    </>
  );
}

function Wordmark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) text-white">
        <Icon name="school" className="!text-lg" />
      </span>
      <span className="font-[family-name:var(--font-display)] text-base font-extrabold tracking-tight">
        ICT<span className="text-(--color-awaken-accent)">Campus</span>
      </span>
    </Link>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)"
          : "text-(--color-awaken-ink-soft) hover:bg-(--color-awaken-bg) hover:text-(--color-awaken-ink)",
      )}
    >
      <Icon name={item.icon} className={active ? "text-(--color-awaken-accent)" : ""} />
      {item.label}
    </Link>
  );
}
