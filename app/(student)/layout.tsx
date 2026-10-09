import type { Viewport } from "next";

/**
 * The warm near-black behind the Android address bar, so the browser chrome
 * matches `.ict-app` rather than flashing the public site's cream over a dark
 * screen. Overrides the root layout's cream for this route group only.
 */
export const viewport: Viewport = { themeColor: "#0e0c0b" };

import { resolveSession } from "@/lib/auth/session";
import { listCohorts, listEnrollments, listProducts, listSubjects } from "@/lib/queries";
import { getLocale, getT } from "@/lib/i18n/server";
import { paymentsPaused } from "@/lib/payments/launch";
import { ensureSurvivalPack } from "@/lib/content/ensure-product";
import { ensureCampusMatch } from "@/lib/campus-match/ensure";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";
import { EXAM_PACK } from "@/lib/exam-pack/config";
import { getExamPackSettings } from "@/lib/exam-pack/settings";
import { shouldRecordRole } from "@/lib/activity/policy";
import { ActivityRecorder } from "@/components/activity/ActivityRecorder";
import { AppShell, type NavGroup, type NavItem, type ShellPromo } from "@/components/nav/AppShell";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { Chip } from "@/components/ds";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import type { TourConfig, TourSlide } from "@/components/tour/WelcomeTour";
import { LOCALE_LABEL } from "@/lib/i18n/dictionary";
import type { SearchEntry } from "@/lib/search";

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

  const [enrollments, subjects, cohorts, products, t, locale, examPack] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
    listCohorts(),
    listProducts(),
    getT(),
    getLocale(),
    getExamPackSettings(),
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

  groups.push({
    items: [
      { href: "/dashboard", label: t("nav.dashboard"), icon: "home" },
      // Above the subject group on purpose: "when is my next class" is the
      // question a student opens this app to answer more often than any other.
      { href: "/classes", label: t("nav.classes"), icon: "event" },
    ],
  });

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
      {
        // The in-app roadmap, not the public `/syllabus/{id}` page. The public
        // one stays for search traffic; sending a signed-in student there
        // dropped them out of the dark world onto a cream page with a guest
        // header and no rail.
        href: `/subjects/${primary.id}/syllabus`,
        label: t("nav.syllabus"),
        icon: "auto_stories",
        matchPrefix: true,
      },
      {
        href: `/subjects/${primary.id}/certificate`,
        label: t("nav.certificate"),
        icon: "military_tech",
      },
    ];
    groups.push({ label: primary.name, items: study });
    mobileTabs.push(
      { href: "/classes", label: t("nav.classes"), icon: "event" },
      { href: study[0].href, label: t("nav.practice"), icon: "quiz" },
      { href: study[1].href, label: t("nav.mocks"), icon: "schedule", matchPrefix: true },
    );
  } else {
    mobileTabs.push(
      { href: "/library", label: t("nav.notes"), icon: "description" },
      { href: "/account", label: t("nav.account"), icon: "account_circle" },
    );
  }

  // The Exam Pack — the flagship. Shown to everyone while it is on sale, not
  // only to buyers: the rail is the one place every student passes, and the
  // pack's own page is where it is sold. A buyer keeps the entry if it is
  // later taken off sale; staff always see it.
  if (examPack.enabled || activeIds.has(EXAM_PACK.id) || isStaff) {
    groups.push({
      label: "A/L ICT 2027",
      items: [{ href: EXAM_PACK.appPath, label: t("nav.examPack"), icon: "workspace_premium", matchPrefix: true }],
    });
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

  // One in-app destination rather than three links out to the public site.
  // `/notes`, `/past-papers` and `/command-words` are still there for search
  // traffic; `/library` is the same material for someone already signed in,
  // with per-click signed download URLs the cached public page cannot offer.
  groups.push({
    label: t("nav.groupFree"),
    items: [{ href: "/library", label: t("nav.library"), icon: "description" }],
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

  // Every screen the rail offers, as search entries. Derived from `groups`
  // rather than written out again: a nav item added above is searchable
  // without anyone remembering to add it here twice.
  const searchPages: SearchEntry[] = groups.flatMap((group) =>
    group.items.map((item) => ({
      t: item.label,
      s: group.label ?? t("nav.dashboard"),
      h: item.href,
      k: "page" as const,
      q: `${item.label} ${group.label ?? ""}`.toLowerCase(),
    })),
  );

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

  // The welcome tour, most striking features first. Subject-bound stops link
  // into the student's own subject — or, before they have one, the first
  // subject, whose pages show what a subscription opens.
  const tourSubject = primary ?? subjects[0];
  const subjectHref = (path: string) => (tourSubject ? `/subjects/${tourSubject.id}${path}` : undefined);
  const stop = (
    key: "live" | "lab" | "mocks" | "practice" | "syllabus" | "library" | "certificate" | "everywhere",
    extra: Pick<TourSlide, "href" | "access">,
  ): TourSlide => ({
    scene: key,
    eyebrow: t(`tour.${key}.eyebrow`),
    title: t(`tour.${key}.title`),
    body: t(`tour.${key}.body`),
    points: (["p1", "p2", "p3"] as const).map((p) => t(`tour.${key}.${p}`)),
    cta: key === "everywhere" ? undefined : t(`tour.${key}.cta`),
    ...extra,
  });
  const tour: TourConfig & { openLabel: string } = {
    openLabel: t("tour.open"),
    // Students only: the owner opens the dashboard on every device they test
    // with and does not need welcoming on each one. The rail row still works.
    autoStart: !isStaff,
    slides: [
      {
        scene: "welcome",
        eyebrow: t("tour.welcome.eyebrow"),
        title: t("tour.welcome.title"),
        body: t("tour.welcome.body"),
        points: [t("tour.welcome.p1"), t("tour.welcome.p2"), t("tour.welcome.p3")],
      },
      stop("live", { href: "/classes", access: "included" }),
      stop("lab", { href: subjectHref("/lab"), access: "included" }),
      stop("mocks", { href: subjectHref("/mock-exams"), access: "included" }),
      stop("practice", { href: subjectHref("/practice"), access: "included" }),
      stop("syllabus", { href: subjectHref("/syllabus") }),
      stop("library", { href: "/library", access: "free" }),
      stop("certificate", { href: subjectHref("/certificate"), access: "included" }),
      stop("everywhere", {}),
      {
        scene: "done",
        eyebrow: t("tour.done.eyebrow"),
        title: t("tour.done.title"),
        body: t("tour.done.body"),
        points: [],
      },
    ],
    labels: {
      skip: t("tour.skip"),
      next: t("tour.next"),
      back: t("tour.back"),
      finish: t("tour.finish"),
      close: t("tour.close"),
      progress: t("tour.progress"),
      goTo: t("tour.goTo"),
      free: t("tour.free"),
      included: t("tour.included"),
      swipe: t("tour.swipe"),
    },
    scene: {
      live: t("tour.scene.live"),
      watching: t("tour.scene.watching"),
      correct: t("tour.scene.correct"),
      handUp: t("tour.scene.handUp"),
      run: t("tour.scene.run"),
      rows: t("tour.scene.rows"),
      timeLeft: t("tour.scene.timeLeft"),
      answered: t("tour.scene.answered"),
      score: t("tour.scene.score"),
      comesBack: t("tour.scene.comesBack"),
      xp: t("tour.scene.xp"),
      streak: t("dash.streakChip", { days: 7 }),
      certificate: t("tour.scene.certificate"),
      reminder: t("tour.scene.reminder"),
      search: t("search.search"),
      english: LOCALE_LABEL.en,
      sinhala: LOCALE_LABEL.si,
      tiles: [
        t("nav.classes"),
        t("nav.codeLab"),
        t("nav.mocks"),
        t("nav.practice"),
        t("nav.syllabus"),
        t("nav.library"),
      ],
    },
  };

  return (
    <AppShell
      groups={groups}
      mobileTabs={mobileTabs}
      user={{ name: user.name, role: user.role }}
      promo={promo}
      languageToggle={<LanguageToggle current={locale} className="w-full justify-center" />}
      tour={tour}
      labels={{
        menu: t("nav.menu"),
        more: t("nav.more"),
        yourAccount: t("nav.yourAccount"),
        signOut: t("nav.signOut"),
      }}
      topbarRight={
        <>
          {/* The rail's own screens are seeded into search from here, so a
              student who types "mock" reaches mock exams whether or not the
              index has loaded — and so search works at all when it cannot. */}
          <SearchTrigger
            staticPages={searchPages}
            labels={{
              search: t("search.search"),
              placeholder: t("search.placeholder"),
              empty: t("search.empty"),
              hint: t("search.hint"),
              close: t("search.close"),
              failed: t("search.failed"),
            }}
          />
          {activeIds.size > 0 ? (
            <Chip icon="check_circle" className="hidden sm:inline-flex">
              {t("status.subscribed")}
            </Chip>
          ) : (
            <Chip icon="lock" className="hidden sm:inline-flex">
              {t("status.notSubscribed")}
            </Chip>
          )}
        </>
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
