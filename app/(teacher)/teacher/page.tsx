import { adminDb, col } from "@/lib/firebase/admin";
import { requireStaffPage } from "@/lib/auth/session";
import { listSubjects, listUnits } from "@/lib/queries";
import { publicEnv } from "@/lib/env";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { getBusinessOverview, type BusinessOverview } from "@/lib/teacher/insights";
import { ScheduleSessionForm, type UnitOption } from "@/components/teacher/ScheduleSessionForm";
import { SeedSubjectsButton } from "@/components/teacher/SeedSubjectsButton";
import { DeviceResetPanel } from "@/components/teacher/DeviceResetPanel";
import { ActivityBell } from "@/components/teacher/ActivityBell";
import { SeedQuestionsButton } from "@/components/teacher/SeedQuestionsButton";
import { SeedLessonsButton } from "@/components/teacher/SeedLessonsButton";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  ButtonLink,
  Card,
  CardLink,
  EmptyState,
  Eyebrow,
  IconBadge,
  PageHeader,
  SectionBar,
  StatCard,
  StatusChip,
  StatusDot,
} from "@/components/ds";
import { zoomConfigured } from "@/lib/features";
import type { ClassSession, Payment, SessionSecrets } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Runs one page section's read, falling back to `empty` if it throws.
 *
 * Logs loudly rather than silently: a Firestore FAILED_PRECONDITION here means
 * a query needs a composite index that does not exist, and that message
 * contains the console link to create it.
 */
async function section<T>(name: string, read: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await read();
  } catch (err) {
    console.error(`[teacher] "${name}" failed to load`, err);
    return empty;
  }
}

/**
 * The teacher's overview.
 *
 * This was a long scroll of forms with five pill buttons wrapping across the
 * top, and it opened with "Subjects: 1" — a number nobody has ever needed. It
 * is now a dashboard in the real sense: the four numbers the business actually
 * turns on, then anything waiting on the teacher, then today's teaching, then
 * the tools. Sections are read independently so one broken query degrades its
 * own card rather than blanking the console.
 */
export default async function TeacherConsolePage() {
  const user = await requireStaffPage("/teacher");

  const subjects = await section("subjects", () => listSubjects(), []);

  const [overview, sessions, slipCount] = await Promise.all([
    section<BusinessOverview>("overview", () => getBusinessOverview(subjects), {
      activeStudents: 0,
      mrrLKR: 0,
      newStudentsThisMonth: 0,
      pendingRevenueLKR: 0,
      pendingSlipCount: 0,
    }),
    section("sessions", () => upcomingSessions(), []),
    section("slips", () => pendingSlipCount(), 0),
  ]);

  // Start URLs are read here, server-side, and rendered only into this
  // teacher-gated page. They never touch a student-readable document.
  const startUrls = await section("startUrls", () => startUrlsFor(sessions.map((s) => s.id)), {});

  // Lets the schedule form tag a class with the syllabus unit it teaches,
  // which is what surfaces it on the public syllabus page beside that topic.
  const unitsBySubject = await section(
    "units",
    () => unitOptions(subjects.map((s) => s.id)),
    {} as Record<string, UnitOption[]>,
  );

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const thisWeek = sessions.filter((s) => s.startsAt < now + 7 * 24 * 60 * 60 * 1000).length;
  const [nextSession] = sessions;
  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        eyebrow="Teacher console"
        title={`Good to see you, ${firstName}`}
        subtitle="Your class, your students and your money, at a glance."
        actions={<ActivityBell />}
      />

      {/* ------------------------------------------------------------------ */}
      {/* The four numbers the business turns on. Each one is a link, because  */}
      {/* a metric you cannot act on is decoration.                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          icon="group"
          label="Active students"
          value={overview.activeStudents}
          hint={
            overview.newStudentsThisMonth > 0
              ? `+${overview.newStudentsThisMonth} this month`
              : "No new students yet"
          }
          tone={overview.newStudentsThisMonth > 0 ? "success" : "neutral"}
          href="/teacher/users"
        />
        <StatCard
          icon="payments"
          label="Monthly revenue"
          value={formatLKR(overview.mrrLKR)}
          hint="From active subscriptions"
          href="/teacher/payments"
        />
        <StatCard
          icon="receipt_long"
          label="Waiting on you"
          value={slipCount}
          hint={
            slipCount > 0
              ? `${formatLKR(overview.pendingRevenueLKR)} to approve`
              : "Nothing to approve"
          }
          tone={slipCount > 0 ? "warning" : "neutral"}
          href="/teacher/payments"
        />
        <StatCard
          icon="event"
          label="Classes this week"
          value={thisWeek}
          hint={nextSession ? relativeToNow(nextSession.startsAt) : "Nothing scheduled"}
          tone={nextSession?.state === "live" ? "success" : "neutral"}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Action queue — the one thing that is genuinely urgent.              */}
      {/* ------------------------------------------------------------------ */}
      {slipCount > 0 ? (
        <Card variant="feature" radius="panel" className="mt-3 p-6">
          <Eyebrow>Needs approving</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-ict-paper-50">
            {slipCount} bank slip{slipCount === 1 ? "" : "s"} waiting
          </h2>
          <p className="mt-2 text-sm text-ict-orange-200">
            {formatLKR(overview.pendingRevenueLKR)} a student has already sent. Until you approve it,
            their class stays locked.
          </p>
          <ButtonLink href="/teacher/payments" arrow="right" className="mt-5">
            Review slips
          </ButtonLink>
        </Card>
      ) : null}

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-5">
          {/* -------------------------------------------------------------- */}
          {/* Teaching                                                        */}
          {/* -------------------------------------------------------------- */}
          <section>
            <SectionBar
              title="Upcoming classes"
              hint={sessions.length > 0 ? `Next ${sessions.length}` : undefined}
            />
            {sessions.length === 0 ? (
              <EmptyState
                icon="event"
                title="Nothing scheduled"
                body="Schedule a class below and it appears on every subscribed student's timetable."
              />
            ) : (
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconBadge
                        icon={session.state === "live" ? "live_tv" : "videocam"}
                        tone={session.state === "live" ? "brand" : "dark"}
                        size={40}
                        round
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ict-paper-50">
                          {session.title}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ict-ink-300">
                          <StatusDot tone={session.state === "live" ? "success" : "info"} />
                          {formatSessionTime(session.startsAt)} · {session.durationMinutes} min
                          {session.hlsUrl ? " · simulcast on" : ""}
                        </p>
                      </div>
                    </div>
                    {startUrls[session.id] ? (
                      <a
                        href={startUrls[session.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ict-press inline-flex h-8 shrink-0 items-center gap-2 rounded-full bg-ict-orange-500 px-4 text-[13px] font-semibold text-white shadow-ict-brand transition-colors duration-[120ms] hover:bg-ict-orange-600"
                      >
                        <Icon name="videocam" className="!text-sm" />
                        Start class
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionBar title="Schedule a class" hint="Students see it on their timetable at once" />
            {zoomConfigured() ? (
              <Card radius="card" className="p-5">
                <ScheduleSessionForm
                  subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
                  unitsBySubject={unitsBySubject}
                />
              </Card>
            ) : (
              <NotConfigured feature="zoom" forTeacher />
            )}
          </section>

          {subjects.length === 0 ? (
            <section>
              <SectionBar title="Get started" hint="Create your class to begin" />
              <Card radius="card" className="p-5">
                <SeedSubjectsButton />
              </Card>
            </section>
          ) : (
            <section>
              <SectionBar title="Content" hint="Fill your class with syllabus and questions" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Card radius="md" className="p-5">
                  <SeedQuestionsButton />
                </Card>
                <Card radius="md" className="p-5">
                  <SeedLessonsButton />
                </Card>
              </div>
            </section>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right column                                                      */}
        {/* ---------------------------------------------------------------- */}
        <aside className="space-y-3">
          <Card radius="card" className="p-5">
            <Eyebrow>Jump to</Eyebrow>
            <div className="mt-3 space-y-2">
              {SHORTCUTS.map((s) => (
                <CardLink
                  key={s.href}
                  href={s.href}
                  variant="raised"
                  radius="md"
                  className="flex items-center gap-3 p-3"
                >
                  <IconBadge icon={s.icon} tone="soft" size={36} round />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ict-paper-50">{s.title}</span>
                    <span className="block truncate text-xs text-ict-ink-300">{s.blurb}</span>
                  </span>
                  <Icon name="chevron_right" className="ml-auto !text-base text-ict-ink-400" />
                </CardLink>
              ))}
            </div>
          </Card>

          <Card radius="card" className="p-5">
            <Eyebrow>Device reset</Eyebrow>
            <p className="mt-2 text-sm text-ict-ink-300">
              Students free their own stale device once a week, so this is the backstop — a lost
              phone, or a second swap in the same week. Your own account is never capped.
            </p>
            <div className="mt-4">
              <DeviceResetPanel />
            </div>
            <p className="mt-3 text-xs text-ict-ink-400">
              To browse everyone instead of looking up one number, use People.
            </p>
          </Card>

          <Card radius="card" className="p-5">
            <Eyebrow>All time</Eyebrow>
            <div className="mt-3 space-y-2.5 text-sm">
              <Row label="Subjects" value={String(subjects.length)} />
              <Row label="New this month" value={String(overview.newStudentsThisMonth)} />
              <Row label="Pending revenue" value={formatLKR(overview.pendingRevenueLKR)} />
            </div>
            <div className="mt-4">
              <StatusChip tone={slipCount > 0 ? "warning" : "success"}>
                {slipCount > 0 ? `${slipCount} to review` : "All caught up"}
              </StatusChip>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

const SHORTCUTS: Array<{ href: string; title: string; blurb: string; icon: IconName }> = [
  { href: "/teacher/users", title: "People", blurb: "Every account, searchable", icon: "group" },
  { href: "/teacher/payments", title: "Payments", blurb: "Slips, ledger, receipts", icon: "payments" },
  { href: "/teacher/insights", title: "Insights", blurb: "Who needs a nudge", icon: "insights" },
  { href: "/teacher/mock-exams", title: "Mock exams", blurb: "Set a timed paper", icon: "schedule" },
  { href: "/teacher/leads", title: "Subscribers", blurb: "Emails from the free hub", icon: "mail" },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ict-ink-300">{label}</span>
      <span className="font-semibold text-ict-paper-50">{value}</span>
    </div>
  );
}

/**
 * Range + orderBy on the same field, so Firestore's automatic single-field
 * index covers it. Adding the tenantId equality back into the query would
 * demand a composite index, which a browser-only setup can never deploy — see
 * the note at the top of lib/queries.ts.
 */
async function upcomingSessions(): Promise<ClassSession[]> {
  const snap = await col
    .sessions()
    .where("startsAt", ">=", Date.now() - 3 * 60 * 60 * 1000)
    .orderBy("startsAt", "asc")
    .limit(60)
    .get();

  return snap.docs
    .map((d) => d.data() as ClassSession)
    .filter((s) => s.tenantId === publicEnv.tenantId)
    .slice(0, 8);
}

/**
 * The unit and lesson lists behind the schedule form's pickers, keyed by
 * subject. Only the fields the pickers show — the lesson bodies are large and
 * the console never renders them.
 */
async function unitOptions(subjectIds: string[]): Promise<Record<string, UnitOption[]>> {
  const entries = await Promise.all(
    subjectIds.map(async (subjectId) => {
      const units = await listUnits(subjectId);
      return [
        subjectId,
        units.map((u) => ({
          id: u.id,
          competencyNumber: u.competencyNumber,
          title: u.title,
          lessons: u.lessons.map((l) => ({ id: l.id, title: l.title })),
        })),
      ] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function startUrlsFor(sessionIds: string[]): Promise<Record<string, string>> {
  if (sessionIds.length === 0) return {};
  const refs = sessionIds.map((id) => adminDb().collection("sessionSecrets").doc(id));
  const snaps = await adminDb().getAll(...refs);
  const out: Record<string, string> = {};
  for (const snap of snaps) {
    const data = snap.data() as SessionSecrets | undefined;
    if (data?.zoomStartUrl) out[snap.id] = data.zoomStartUrl;
  }
  return out;
}

async function pendingSlipCount(): Promise<number> {
  // Single equality filter — automatically indexed. Tenant and provider are
  // applied in memory to avoid needing a composite index.
  const snap = await col.payments().where("status", "==", "pending").limit(200).get();
  return snap.docs
    .map((d) => d.data() as Payment)
    .filter((p) => p.tenantId === publicEnv.tenantId && p.provider === "bank_slip").length;
}
