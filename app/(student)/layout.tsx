import { resolveSession } from "@/lib/auth/session";
import { listCohorts, listEnrollments, listProducts, listSubjects } from "@/lib/queries";
import { getLocale, getT } from "@/lib/i18n/server";
import { paymentsPaused } from "@/lib/payments/launch";
import { ensureSurvivalPack } from "@/lib/content/ensure-product";
import { ensureCampusMatch } from "@/lib/campus-match/ensure";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";
import { shouldRecordRole } from "@/lib/activity/policy";
import { ActivityRecorder } from "@/components/activity/ActivityRecorder";
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

  // Both products have to exist before anything can list or sell them, and the
  // console has no screen that creates one. Once per server instance each;
  // Campus Match is created inactive until the owner publishes it.
  await Promise.all([ensureSurvivalPack(), ensureCampusMatch()]);

  const [enrollments, subjects, cohorts, products, t, locale] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
    listCohorts(),
    listProducts(),
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
  // Any enrollment document at all spends the trial for that subject — the rule
  // `startFreeTrial` enforces — so this asks whether one is still untouched.
  const enrolledIds = new Set(enrollments.map((e) => e.subjectId));
  const trialStillAvailable = subjects.some((s) => !enrolledIds.has(s.id));

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

  // A cohort the student is actually in gets its own rail entry. Not offered to
  // someone who has not enrolled: the dashboard card is where an intake is sold,
  // and a permanent nav link to something you cannot open is noise.
  const myCohort = cohorts.find((c) => activeIds.has(c.id)) ?? (isStaff ? cohorts[0] : undefined);
  // Same rule for a pack the student owns. Both live under one Campus Ready
  // heading rather than two, so owning the pack alone does not put a
  // one-item group in the rail.
  //
  // Campus Match is a product too, but it is not a pack and has nothing at
  // `/packs/{id}` — so it is taken out of this lookup and given its own entry,
  // or a student who bought it would get a rail link to a page that 404s.
  const packs = products.filter((p) => p.id !== CAMPUS_MATCH_ID);
  const myPack = packs.find((p) => activeIds.has(p.id)) ?? (isStaff ? packs[0] : undefined);
  const ownsMatch = activeIds.has(CAMPUS_MATCH_ID) || isStaff;
  if (myCohort || myPack || ownsMatch) {
    const campusItems: NavItem[] = [];
    if (myCohort) {
      campusItems.push({ href: `/campus/${myCohort.id}`, label: t("nav.campus"), icon: "school" });
    }
    if (myPack) {
      campusItems.push({ href: `/packs/${myPack.id}`, label: t("nav.pack"), icon: "inventory_2" });
    }
    if (ownsMatch) {
      campusItems.push({
        href: "/campus-match/report",
        label: t("nav.match"),
        icon: "insights",
        matchPrefix: true,
      });
    }
    groups.push({ label: t("campus.title"), items: campusItems });
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
          // The rail is on every screen, so during the trial-only launch it is
          // the one place that tells a student, everywhere, that nothing is
          // being charged — see `lib/payments/launch.ts`. It must not keep
          // offering a free trial to someone who has already spent theirs and
          // has no way to pay, so it switches to "soon" once one exists.
          title: !paymentsPaused()
            ? t("promo.title")
            : trialStillAvailable
              ? t("promo.launchTitle")
              : t("launch.trialEndedEyebrow"),
          body: !paymentsPaused()
            ? t("promo.body")
            : trialStillAvailable
              ? t("promo.launchBody")
              : t("launch.short"),
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
      {/* Students only. The owner opens these same screens on a laptop, a phone
          and a second browser to check what students see, and logging that
          would put their own browsing on the bill — see lib/activity/policy.ts.
          The route enforces this too; this just stops the requests. */}
      {shouldRecordRole(user.role) ? <ActivityRecorder /> : null}
      {children}
    </AppShell>
  );
}
