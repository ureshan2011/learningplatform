import { resolveSession } from "@/lib/auth/session";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { AppShell, type NavGroup, type NavItem, type ShellPromo } from "@/components/nav/AppShell";
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

  const [enrollments, subjects] = await Promise.all([listEnrollments(user.uid), listSubjects()]);
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
  const mobileTabs: NavItem[] = [{ href: "/dashboard", label: "Home", icon: "home" }];

  groups.push({ items: [{ href: "/dashboard", label: "Dashboard", icon: "home" }] });

  if (primary) {
    const study: NavItem[] = [
      { href: `/subjects/${primary.id}/practice`, label: "Practice", icon: "quiz" },
      { href: `/subjects/${primary.id}/mock-exams`, label: "Mock exams", icon: "schedule", matchPrefix: true },
      { href: `/subjects/${primary.id}/lab`, label: "Code Lab", icon: "code" },
      { href: `/subjects/${primary.id}`, label: "Notes & papers", icon: "description" },
      { href: `/syllabus/${primary.id}`, label: "Syllabus", icon: "auto_stories" },
      { href: `/subjects/${primary.id}/certificate`, label: "Certificate", icon: "military_tech" },
    ];
    groups.push({ label: primary.name, items: study });
    mobileTabs.push(study[0], study[1], study[3]);
  } else {
    mobileTabs.push(
      { href: "/notes", label: "Notes", icon: "description" },
      { href: "/syllabus", label: "Syllabus", icon: "auto_stories" },
      { href: "/account", label: "Account", icon: "account_circle" },
    );
  }

  groups.push({
    label: "Free resources",
    items: [
      { href: "/notes", label: "Free notes", icon: "description" },
      { href: "/past-papers", label: "Past papers", icon: "receipt_long" },
      { href: "/command-words", label: "Command words", icon: "fact_check" },
    ],
  });

  groups.push({
    label: "You",
    items: [{ href: "/account", label: "Account & billing", icon: "account_circle" }],
  });

  if (isStaff) {
    groups.push({
      label: "Staff",
      items: [{ href: "/teacher", label: "Teacher console", icon: "workspace_premium", matchPrefix: true }],
    });
  }

  const promo: ShellPromo | undefined =
    activeIds.size === 0 && !isStaff && primary
      ? {
          title: "Unlock the full class",
          body: "Live classes, practice, mock exams and every paper.",
          href: `/subjects/${primary.id}`,
          cta: "See details",
        }
      : undefined;

  return (
    <AppShell
      groups={groups}
      mobileTabs={mobileTabs}
      user={{ name: user.name, role: user.role }}
      promo={promo}
      topbarRight={
        activeIds.size > 0 ? (
          <Chip icon="check_circle">Subscribed</Chip>
        ) : (
          <Chip icon="lock">Not subscribed</Chip>
        )
      }
    >
      {children}
    </AppShell>
  );
}
