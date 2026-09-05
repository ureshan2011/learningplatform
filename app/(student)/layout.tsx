import { resolveSession } from "@/lib/auth/session";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { getLocale, getT } from "@/lib/i18n/server";
import { AppShell, type NavGroup, type NavItem, type ShellPromo } from "@/components/nav/AppShell";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { Chip } from "@/components/ds";

/**
 * The shell for the whole signed-in student area.
 *
 * Each page below still runs its own `requirePageUser()` — this layout does not
 * replace that check, it only supplies the chrome around it. If there is no
 * session the page underneath is about to redirect, so the shell is skipped
 * rather than flashed.
 *
 * ## The subject-aware navigation
 *
 * Practice, mock exams, the Code Lab and the syllabus all live *under* a
 * subject in the URL, which is why they used to be invisible: nothing could
 * link to them without knowing which subject to open. So the layout resolves
 * the student's own subject once and lifts those four straight into the
 * sidebar. In practice this platform teaches exactly one subject, so "Practice"
 * means what a student expects it to mean and is one tap from anywhere.
 *
 * A student with no subscription gets the shorter menu plus the upsell card —
 * there is no point offering a Code Lab they cannot open.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user } = await resolveSession();
  if (!user) return <>{children}</>;

  const [enrollments, subjects, t, locale] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
    getT(),
    getLocale(),
  ]);

  // Server Component: renders once per request, so reading the clock here is
  // deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  // Staff see every subject: they need to open the student experience for a
  // class nobody has paid for yet in order to check it.
  const isStaff = user.role === "teacher" || user.role === "admin";
  const activeIds = new Set(
    enrollments.filter((e) => e.status === "active" && e.currentPeriodEnd > now).map((e) => e.subjectId),
  );
  const primary = subjects.find((s) => activeIds.has(s.id)) ?? (isStaff ? subjects[0] : undefined);

  const groups: NavGroup[] = [];
  const mobileTabs: NavItem[] = [{ href: "/dashboard", label: t("nav.home"), icon: "home" }];

  groups.push({ items: [{ href: "/dashboard", label: t("nav.dashboard"), icon: "home" }] });

  if (primary) {
    const study: NavItem[] = [
      { href: `/subjects/${primary.id}/practice`, label: t("nav.practice"), icon: "quiz" },
      {
        href: `/subjects/${primary.id}/mock-exams`,
        label: t("nav.mockExams"),
        icon: "schedule",
        matchPrefix: true,
      },
      { href: `/subjects/${primary.id}/lab`, label: t("nav.codeLab"), icon: "code" },
      { href: `/subjects/${primary.id}`, label: t("nav.notesPapers"), icon: "description" },
      { href: `/syllabus/${primary.id}`, label: t("nav.syllabus"), icon: "auto_stories" },
      {
        href: `/subjects/${primary.id}/certificate`,
        label: t("nav.certificate"),
        icon: "military_tech",
      },
    ];
    groups.push({ label: primary.name, items: study });
    mobileTabs.push(
      { href: study[0].href, label: t("nav.practice"), icon: "quiz" },
      { href: study[1].href, label: t("nav.mocks"), icon: "schedule", matchPrefix: true },
      { href: study[3].href, label: t("nav.notes"), icon: "description" },
    );
  } else {
    mobileTabs.push(
      { href: "/notes", label: t("nav.notes"), icon: "description" },
      { href: "/syllabus", label: t("nav.syllabus"), icon: "auto_stories" },
      { href: "/account", label: t("nav.account"), icon: "account_circle" },
    );
  }

  groups.push({
    label: t("nav.groupFree"),
    items: [
      { href: "/notes", label: t("nav.freeNotes"), icon: "description" },
      { href: "/past-papers", label: t("nav.pastPapers"), icon: "receipt_long" },
      { href: "/command-words", label: t("nav.commandWords"), icon: "fact_check" },
    ],
  });

  groups.push({
    label: t("nav.groupYou"),
    items: [{ href: "/account", label: t("nav.account"), icon: "account_circle" }],
  });

  if (isStaff) {
    groups.push({
      label: t("nav.groupStaff"),
      items: [
        {
          href: "/teacher",
          label: t("nav.teacherConsole"),
          icon: "workspace_premium",
          matchPrefix: true,
        },
      ],
    });
  }

  const promo: ShellPromo | undefined =
    activeIds.size === 0 && !isStaff && primary
      ? {
          title: t("promo.title"),
          body: t("promo.body"),
          href: `/subjects/${primary.id}`,
          cta: t("promo.cta"),
        }
      : undefined;

  return (
    <AppShell
      groups={groups}
      mobileTabs={mobileTabs}
      user={{ name: user.name, role: user.role }}
      promo={promo}
      languageToggle={<LanguageToggle current={locale} className="w-full justify-center" />}
      labels={{
        menu: t("nav.menu"),
        more: t("nav.more"),
        yourAccount: t("nav.yourAccount"),
        signOut: t("nav.signOut"),
      }}
      topbarRight={
        activeIds.size > 0 ? (
          <Chip icon="check_circle">{t("status.subscribed")}</Chip>
        ) : (
          <Chip icon="lock">{t("status.notSubscribed")}</Chip>
        )
      }
    >
      {children}
    </AppShell>
  );
}
