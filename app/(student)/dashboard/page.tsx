import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { listEnrollments, listSubjects, listUpcomingSessions, getProgress } from "@/lib/queries";
import { formatDate, formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { getPayHereConfig } from "@/lib/payments/records";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  Badge,
  ButtonLink,
  Card,
  CardLink,
  Chip,
  Eyebrow,
  IconBadge,
  ProgressBar,
  SectionBar,
  StatusChip,
  StatusDot,
} from "@/components/ds";
import type { ClassSession, Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The student's home.
 *
 * Built to the design system's product archetype: one cocoa feature banner
 * carrying the single most important thing on the screen, a main column of
 * work, and a narrower schedule column beside it. The old version opened with
 * four decorative stat tiles and buried "what do I do next" below the fold —
 * this one answers that in the first 200 pixels and lets the numbers support it
 * rather than lead.
 *
 * Everything here is one tap from a destination. A card that only reports a
 * number is a card that made the student go and find the thing themselves.
 */
export default async function DashboardPage() {
  const user = await requirePageUser("/dashboard");

  const [enrollments, subjects] = await Promise.all([listEnrollments(user.uid), listSubjects()]);

  // Server Component: this renders once per request, so reading the clock here
  // is deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const activeSubjectIds = enrollments
    .filter((e) => e.status === "active" && e.currentPeriodEnd > now)
    .map((e) => e.subjectId);

  const [sessions, progressList] = await Promise.all([
    listUpcomingSessions(activeSubjectIds),
    Promise.all(activeSubjectIds.map((id) => getProgress(user.uid, id))),
  ]);

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const payhere = await getPayHereConfig();
  const cardPaymentsOn = payhere.configured;

  const streakDays = progressList.reduce((max, p) => Math.max(max, p?.streakDays ?? 0), 0);
  const totalXp = progressList.reduce((sum, p) => sum + (p?.xp ?? 0), 0);
  const primary = subjects.find((s) => activeSubjectIds.includes(s.id));

  const [nextSession, ...laterSessions] = sessions;
  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6">
      {/* ------------------------------------------------------------------ */}
      {/* Feature banner — the system permits exactly one cocoa surface per    */}
      {/* screen, so it carries the single thing that matters most right now.  */}
      {/* ------------------------------------------------------------------ */}
      <Card variant="feature" radius="panel" className="ict-enter overflow-hidden p-6 sm:p-8">
        <div className="lg:flex lg:items-center lg:gap-10">
          <div className="min-w-0 lg:flex-1">
            <p className="text-sm text-ict-orange-200">Hi {firstName},</p>
            <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ict-paper-50 sm:text-[34px]">
              {nextSession ? (
                nextSession.state === "live" ? (
                  <>
                    Your class is
                    <br />
                    live right now
                  </>
                ) : (
                  <>
                    {nextSession.title}
                    <br />
                    <span className="text-ict-orange-200">{relativeToNow(nextSession.startsAt)}</span>
                  </>
                )
              ) : activeSubjectIds.length === 0 ? (
                <>
                  Start your
                  <br />
                  A/L ICT class
                </>
              ) : streakDays > 0 ? (
                <>
                  {streakDays} day streak
                  <br />
                  keep it going
                </>
              ) : (
                <>
                  Ready when
                  <br />
                  you are
                </>
              )}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {nextSession ? (
                <ButtonLink href={`/live/${nextSession.id}`} arrow="right">
                  {nextSession.state === "live" ? "Join now" : "Open class"}
                </ButtonLink>
              ) : primary ? (
                <ButtonLink href={`/subjects/${primary.id}/practice`} arrow="right">
                  Practise now
                </ButtonLink>
              ) : subjects[0] ? (
                <ButtonLink href={`/subjects/${subjects[0].id}`} arrow="right">
                  See what&apos;s included
                </ButtonLink>
              ) : null}

              {nextSession ? (
                <span className="text-sm text-ict-orange-200">
                  {formatSessionTime(nextSession.startsAt)}
                </span>
              ) : null}
            </div>
          </div>

          {/* The counters. Dark pill chips with a small orange glyph, per the
              system — not four boxes competing with the headline. */}
          <div className="mt-6 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0 lg:flex-col lg:items-end">
            <Chip icon="local_fire_department">
              {streakDays} day{streakDays === 1 ? "" : "s"} streak
            </Chip>
            <Chip icon="bolt">{totalXp.toLocaleString("en-LK")} XP</Chip>
            <Chip icon="event">
              {sessions.length} class{sessions.length === 1 ? "" : "es"} ahead
            </Chip>
          </div>
        </div>
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* ---------------------------------------------------------------- */}
        {/* Main column                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="min-w-0 space-y-3">
          {primary ? (
            <Card radius="card" className="p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow>Continue studying</Eyebrow>
                  <p className="mt-1.5 font-display text-lg font-extrabold text-ict-paper-50">
                    {primary.name}
                  </p>
                </div>
                <ProgressBar
                  value={levelProgress(progressList[0]?.xp ?? 0)}
                  className="w-full max-w-[220px]"
                />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {STUDY_TOOLS.map((tool) => (
                  <CardLink
                    key={tool.href}
                    href={`/subjects/${primary.id}${tool.href}`}
                    variant="raised"
                    radius="md"
                    className="flex items-center gap-3 p-3.5"
                  >
                    <IconBadge icon={tool.icon} tone="soft" size={40} round />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ict-paper-50">
                        {tool.title}
                      </span>
                      <span className="block truncate text-xs text-ict-ink-300">{tool.blurb}</span>
                    </span>
                    <Icon name="chevron_right" className="ml-auto !text-base text-ict-ink-400" />
                  </CardLink>
                ))}
              </div>
            </Card>
          ) : null}

          <section>
            <SectionBar
              title="Your classes"
              hint={
                activeSubjectIds.length > 0
                  ? "Everything you are subscribed to"
                  : "Subscribe to unlock live classes, practice and papers"
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  active={activeSubjectIds.includes(subject.id)}
                  periodEnd={
                    enrollments.find((e) => e.subjectId === subject.id)?.currentPeriodEnd
                  }
                  cardPaymentsOn={cardPaymentsOn}
                  sandbox={payhere.mode === "sandbox"}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionBar title="Free for everyone" hint="No subscription needed" />
            <div className="grid gap-2 sm:grid-cols-3">
              {FREE_RESOURCES.map((r) => (
                <CardLink key={r.href} href={r.href} radius="md" className="p-4">
                  <IconBadge icon={r.icon} tone="dark" size={40} round />
                  <p className="mt-3 text-[13px] font-semibold text-ict-paper-50">{r.title}</p>
                  <p className="mt-0.5 text-xs text-ict-ink-300">{r.blurb}</p>
                </CardLink>
              ))}
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Schedule column                                                   */}
        {/* ---------------------------------------------------------------- */}
        <aside className="lg:sticky lg:top-[76px]">
          <Card radius="card" className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-extrabold text-ict-paper-50">Timetable</p>
              {sessions.length > 0 ? (
                <span className="text-xs text-ict-ink-300">Next {sessions.length}</span>
              ) : null}
            </div>

            {sessions.length === 0 ? (
              <p className="mt-4 text-sm text-ict-ink-300">
                {activeSubjectIds.length === 0
                  ? "Subscribe and your class timetable appears here."
                  : "Nothing scheduled yet. Your teacher will add the next class soon."}
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {[nextSession, ...laterSessions].map((session) => (
                  <li key={session.id}>
                    <ScheduleRow session={session} subject={subjectById.get(session.subjectId)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {activeSubjectIds.length > 0 ? (
            <Card radius="card" className="mt-3 p-5">
              <p className="font-display text-base font-extrabold text-ict-paper-50">
                Invite a friend
              </p>
              <p className="mt-1 text-sm text-ict-ink-300">
                When they subscribe you both get 3 free days.
              </p>
              <ButtonLink href="/account" variant="outline" size="sm" arrow="right" className="mt-4">
                Get your code
              </ButtonLink>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

const STUDY_TOOLS: Array<{ href: string; title: string; blurb: string; icon: IconName }> = [
  { href: "/practice", title: "Practice", blurb: "Questions that target your weak topics", icon: "quiz" },
  { href: "/mock-exams", title: "Mock exams", blurb: "Timed papers, ranked results", icon: "schedule" },
  { href: "/lab", title: "Code Lab", blurb: "Pseudocode, spreadsheets and SQL", icon: "code" },
  { href: "", title: "Notes & papers", blurb: "Everything to download", icon: "description" },
];

const FREE_RESOURCES: Array<{ href: string; title: string; blurb: string; icon: IconName }> = [
  { href: "/notes", title: "Free notes", blurb: "Open notes and papers", icon: "description" },
  { href: "/past-papers", title: "Past papers", blurb: "Every year, with schemes", icon: "receipt_long" },
  { href: "/command-words", title: "Command words", blurb: "What each question wants", icon: "fact_check" },
];

/**
 * XP to a 0-100 bar.
 *
 * 1,000 XP per level is the same arithmetic the progress engine uses; this is
 * the position *within* the current level, which is the number a student
 * recognises as "how close am I".
 */
function levelProgress(xp: number): number {
  return Math.round(((xp % 1000) / 1000) * 100);
}

function SubjectCard({
  subject,
  active,
  periodEnd,
  cardPaymentsOn,
  sandbox,
}: {
  subject: Subject;
  active: boolean;
  periodEnd?: number;
  cardPaymentsOn: boolean;
  sandbox: boolean;
}) {
  return (
    <Card radius="card" className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-ict-paper-50">{subject.name}</p>
          <p className="mt-1 text-sm text-ict-ink-300">
            {active && periodEnd
              ? `Paid until ${formatDate(periodEnd)}`
              : `${formatLKR(subject.priceLKR)} per month`}
          </p>
        </div>
        <Badge tone={active ? "success" : "neutral"}>{active ? "Active" : subject.grade}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {active ? (
          <ButtonLink href={`/subjects/${subject.id}`} variant="outline" size="sm" arrow="right">
            Open
          </ButtonLink>
        ) : (
          // Both ways to pay, always, with the instant one first. Card unlocks
          // the class in seconds; a bank deposit is how most Sri Lankan parents
          // actually pay, so neither is hidden behind the other.
          <>
            {cardPaymentsOn ? <SubscribeButton subjectId={subject.id} sandbox={sandbox} /> : null}
            <Link
              href={`/pay/slip?subject=${subject.id}`}
              className="text-sm font-semibold text-ict-orange-400 underline-offset-4 hover:underline"
            >
              Pay by bank deposit
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}

function ScheduleRow({ session, subject }: { session: ClassSession; subject?: Subject }) {
  const live = session.state === "live";
  return (
    <Link
      href={`/live/${session.id}`}
      className="ict-lift block rounded-ict-md border border-ict-border-dark bg-ict-ink-800 p-3.5 hover:border-ict-ink-500"
    >
      <p className="truncate text-[13px] font-semibold text-ict-paper-50">{session.title}</p>
      <p className="mt-1 truncate text-xs text-ict-ink-300">
        {subject?.name ?? session.subjectId}
        {session.topic ? ` · ${session.topic}` : ""}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ict-ink-300">{formatSessionTime(session.startsAt)}</span>
        {live ? (
          <StatusChip tone="success">Live now</StatusChip>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ict-ink-300">
            <StatusDot tone="info" />
            {relativeToNow(session.startsAt)}
          </span>
        )}
      </div>
    </Link>
  );
}
