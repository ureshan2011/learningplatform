import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { listEnrollments, listSubjects, listUpcomingSessions, getProgress } from "@/lib/queries";
import { formatDate, formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { getPayHereConfig } from "@/lib/payments/records";
import { getT, localeAttrs, type Translator } from "@/lib/i18n/server";
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
import type { MessageKey } from "@/lib/i18n/dictionary";
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

  const [enrollments, subjects, t, loc] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
    getT(),
    localeAttrs(),
  ]);

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
    <main lang={loc.lang} className={`mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6 ${loc.className}`}>
      {/* ------------------------------------------------------------------ */}
      {/* Feature banner — the system permits exactly one cocoa surface per    */}
      {/* screen, so it carries the single thing that matters most right now.  */}
      {/* ------------------------------------------------------------------ */}
      <Card variant="feature" radius="panel" className="ict-enter overflow-hidden p-6 sm:p-8">
        <div className="lg:flex lg:items-center lg:gap-10">
          <div className="min-w-0 lg:flex-1">
            <p className="text-sm text-ict-orange-200">{t("dash.greeting", { name: firstName })}</p>
            <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ict-paper-50 sm:text-[34px]">
              {nextSession ? (
                nextSession.state === "live" ? (
<Lines text={t("dash.liveNow")} />
                ) : (
                  <>
                    {nextSession.title}
                    <br />
                    <span className="text-ict-orange-200">{relativeToNow(nextSession.startsAt)}</span>
                  </>
                )
              ) : activeSubjectIds.length === 0 ? (
                <Lines text={t("dash.startClass")} />
              ) : streakDays > 0 ? (
                <Lines text={t("dash.streakHead", { days: streakDays })} />
              ) : (
                <Lines text={t("dash.ready")} />
              )}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {nextSession ? (
                <ButtonLink href={`/live/${nextSession.id}`} arrow="right">
                  {nextSession.state === "live" ? t("dash.joinNow") : t("dash.openClass")}
                </ButtonLink>
              ) : primary ? (
                <ButtonLink href={`/subjects/${primary.id}/practice`} arrow="right">
                  {t("dash.practiseNow")}
                </ButtonLink>
              ) : subjects[0] ? (
                <ButtonLink href={`/subjects/${subjects[0].id}`} arrow="right">
                  {t("dash.seeIncluded")}
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
            <Chip icon="local_fire_department">{t("dash.streakChip", { days: streakDays })}</Chip>
            <Chip icon="bolt">{t("dash.xpChip", { xp: totalXp.toLocaleString("en-LK") })}</Chip>
            <Chip icon="event">{t("dash.classesAhead", { count: sessions.length })}</Chip>
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
                  <Eyebrow>{t("dash.continueStudying")}</Eyebrow>
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
                        {t(tool.title)}
                      </span>
                      <span className="block truncate text-xs text-ict-ink-300">{t(tool.blurb)}</span>
                    </span>
                    <Icon name="chevron_right" className="ml-auto !text-base text-ict-ink-400" />
                  </CardLink>
                ))}
              </div>
            </Card>
          ) : null}

          <section>
            <SectionBar
              title={t("dash.yourClasses")}
              hint={
                activeSubjectIds.length > 0 ? t("dash.yourClassesHint") : t("dash.subscribeHint")
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
                  t={t}
                />
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
              <p className="font-display text-base font-extrabold text-ict-paper-50">{t("dash.timetable")}</p>
              {sessions.length > 0 ? (
                <span className="text-xs text-ict-ink-300">{t("dash.timetableNext", { count: sessions.length })}</span>
              ) : null}
            </div>

            {sessions.length === 0 ? (
              <p className="mt-4 text-sm text-ict-ink-300">
                {activeSubjectIds.length === 0 ? t("dash.noTimetableLocked") : t("dash.noTimetable")}
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {[nextSession, ...laterSessions].map((session) => (
                  <li key={session.id}>
                    <ScheduleRow session={session} subject={subjectById.get(session.subjectId)} t={t} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {activeSubjectIds.length > 0 ? (
            <Card radius="card" className="mt-3 p-5">
              <p className="font-display text-base font-extrabold text-ict-paper-50">
                {t("dash.inviteTitle")}
              </p>
              <p className="mt-1 text-sm text-ict-ink-300">{t("dash.inviteBody")}</p>
              <ButtonLink href="/account" variant="outline" size="sm" arrow="right" className="mt-4">
                {t("dash.inviteCta")}
              </ButtonLink>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

/** Renders a headline whose line breaks are authored in the dictionary, not wrapped. */
function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((line, i) => (
        <span key={line + i}>
          {line}
          {i < parts.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  );
}

const STUDY_TOOLS: Array<{ href: string; title: MessageKey; blurb: MessageKey; icon: IconName }> = [
  { href: "/practice", title: "tool.practice", blurb: "tool.practiceBlurb", icon: "quiz" },
  { href: "/mock-exams", title: "tool.mockExams", blurb: "tool.mockExamsBlurb", icon: "schedule" },
  { href: "/lab", title: "tool.codeLab", blurb: "tool.codeLabBlurb", icon: "code" },
  { href: "", title: "tool.notes", blurb: "tool.notesBlurb", icon: "description" },
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
  t,
}: {
  subject: Subject;
  active: boolean;
  periodEnd?: number;
  cardPaymentsOn: boolean;
  sandbox: boolean;
  t: Translator;
}) {
  return (
    <Card radius="card" className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-ict-paper-50">{subject.name}</p>
          <p className="mt-1 text-sm text-ict-ink-300">
            {active && periodEnd
              ? t("dash.paidUntil", { date: formatDate(periodEnd) })
              : t("dash.perMonth", { price: formatLKR(subject.priceLKR) })}
          </p>
        </div>
        <Badge tone={active ? "success" : "neutral"}>{active ? t("dash.active") : subject.grade}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {active ? (
          <ButtonLink href={`/subjects/${subject.id}`} variant="outline" size="sm" arrow="right">
            {t("dash.open")}
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
              {t("dash.payByBank")}
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}

function ScheduleRow({
  session,
  subject,
  t,
}: {
  session: ClassSession;
  subject?: Subject;
  t: Translator;
}) {
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
          <StatusChip tone="success">{t("dash.liveBadge")}</StatusChip>
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
