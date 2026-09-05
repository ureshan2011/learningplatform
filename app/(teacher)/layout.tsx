import { resolveSession, isStaff } from "@/lib/auth/session";
import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import { AppShell, type NavGroup, type NavItem } from "@/components/nav/AppShell";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { getLocale } from "@/lib/i18n/server";
import { Chip } from "@/components/ds";
import type { Payment } from "@/lib/types";

/**
 * The shell for the teacher console.
 *
 * There was no layout here at all: every console page rendered the public
 * `SiteHeader` and offered a single "back to console" link, so the five
 * sections were reachable only from the console's own header — a hub-and-spoke
 * with a very long spoke. Now the sections are a persistent rail, the same one
 * students get, so moving from Payments to People is one tap instead of three.
 *
 * The pending-slip count is resolved here rather than per page because it is
 * the console's one genuinely urgent number — money a student has sent that
 * nobody has approved — and it belongs in the navigation where it is visible
 * from every screen, not only from the one page that happens to query it.
 */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = await resolveSession();
  if (!user || !isStaff(user.role)) return <>{children}</>;

  const [pendingSlips, locale] = await Promise.all([pendingSlipCount(), getLocale()]);

  const primary: NavItem[] = [
    { href: "/teacher", label: "Overview", icon: "home" },
    { href: "/teacher/users", label: "People", icon: "group" },
    {
      href: "/teacher/payments",
      label: "Payments",
      icon: "payments",
      count: pendingSlips || undefined,
    },
    { href: "/teacher/insights", label: "Insights", icon: "insights" },
  ];

  const groups: NavGroup[] = [
    { items: primary },
    {
      label: "Teaching",
      items: [
        { href: "/teacher/mock-exams", label: "Mock exams", icon: "schedule" },
        { href: "/syllabus", label: "Syllabus", icon: "auto_stories" },
      ],
    },
    {
      label: "Growth",
      items: [{ href: "/teacher/leads", label: "Subscribers", icon: "mail" }],
    },
    {
      label: "You",
      items: [
        { href: "/dashboard", label: "Student view", icon: "school" },
        { href: "/account", label: "Account", icon: "account_circle" },
      ],
    },
  ];

  return (
    <AppShell
      groups={groups}
      mobileTabs={primary}
      user={{ name: user.name, role: user.role }}
      // The console itself stays English — see lib/i18n/dictionary.ts — but the
      // toggle lives here too, so the owner can switch and then go and check the
      // student view without hunting for it.
      languageToggle={<LanguageToggle current={locale} className="w-full justify-center" />}
      labels={{ menu: "Menu", more: "More", yourAccount: "Your account", signOut: "Sign out" }}
      topbarRight={
        pendingSlips > 0 ? (
          <Chip icon="receipt_long">
            {pendingSlips} slip{pendingSlips === 1 ? "" : "s"} waiting
          </Chip>
        ) : (
          <Chip icon="check_circle">All caught up</Chip>
        )
      }
    >
      {children}
    </AppShell>
  );
}

/**
 * Single equality filter, narrowed in memory — the same index-free rule as the
 * rest of `lib/queries.ts`. Never allowed to throw: a failed count must not
 * take down every page in the console.
 */
async function pendingSlipCount(): Promise<number> {
  try {
    const snap = await col.payments().where("status", "==", "pending").limit(200).get();
    return snap.docs
      .map((d) => d.data() as Payment)
      .filter((p) => p.tenantId === publicEnv.tenantId && p.provider === "bank_slip").length;
  } catch (err) {
    console.error("[teacher] pending slip count failed", err);
    return 0;
  }
}
