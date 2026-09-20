import { requirePageUser } from "@/lib/auth/session";
import {
  listEnrollments,
  listSubjects,
  listUpcomingSessions,
  listPastSessions,
} from "@/lib/queries";
import { formatSessionTime, relativeToNow } from "@/lib/format";
import { getT, type Translator } from "@/lib/i18n/server";
import { Icon } from "@/components/ui/Icon";
import {
  ButtonLink,
  Card,
  EmptyState,
  IconBadge,
  PageHeader,
  SectionBar,
  StatusChip,
} from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";
import type { ClassSession, Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The student's timetable.
 *
 * `listUpcomingSessions` existed but was called from exactly one place — the
 * dashboard's narrow schedule column, which shows the next few and nothing
 * else. There was no way to see the week, and a student who missed Tuesday
 * could not find that class again at all: replays were reachable only by
 * remembering the session id and typing `/live/{it}`.
 *
 * So both halves are here. Coming up, with the join button that opens fifteen
 * minutes before the start; and finished, newest first, with the replay when
 * the teacher has uploaded one and an honest "no replay yet" when they have
 * not. Nothing is invented — a class with no replay says so rather than
 * offering a button that fails.
 *
 * Gating is by enrollment, not by `hasAccess` per class: the list is the
 * student's own timetable for subjects they are enrolled in, and joining still
 * goes through the live route, which checks properly.
 */
export default async function ClassesPage() {
  const user = await requirePageUser("/classes");

  const [enrollments, subjects, t] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
    getT(),
  ]);

  // Server Component: renders once per request, so reading the clock here is
  // deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const isStaff = user.role === "teacher" || user.role === "admin";
  const activeSubjectIds = enrollments
    .filter((e) => e.status === "active" && e.currentPeriodEnd > now)
    .map((e) => e.subjectId);

  // Staff open this screen to check what a student sees for a class nobody has
  // paid for yet, the same exemption the rail and the device cap make.
  const subjectIds = activeSubjectIds.length > 0 ? activeSubjectIds : isStaff ? subjects.map((s) => s.id) : [];

  const [upcoming, past] = await Promise.all([
    listUpcomingSessions(subjectIds, 30),
    listPastSessions(subjectIds, 30),
  ]);

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const locked = subjectIds.length === 0;

  return (
    <PageShell width="reading">
      <PageHeader title={t("classes.title")} subtitle={t("classes.subtitle")} />

      {locked ? (
        <Card variant="feature" radius="panel" className="mt-6 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em] text-ict-on-feature">
            {t("classes.locked")}
          </h2>
          <p className="mt-2 max-w-md text-sm text-ict-on-feature-soft">{t("classes.lockedBody")}</p>
          {subjects[0] ? (
            <ButtonLink href={`/subjects/${subjects[0].id}`} arrow="right" className="mt-5">
              {t("dash.seeIncluded")}
            </ButtonLink>
          ) : null}
        </Card>
      ) : (
        <>
          <section className="mt-6">
            <SectionBar
              title={t("classes.upcoming")}
              hint={t("classes.upcomingHint", { count: upcoming.length })}
            />
            {upcoming.length === 0 ? (
              <EmptyState
                icon="schedule"
                title={t("classes.none")}
                body={t("classes.noneBody")}
                action={
                  subjectIds[0] ? (
                    <ButtonLink
                      href={`/subjects/${subjectIds[0]}/syllabus`}
                      variant="outline"
                      size="sm"
                      arrow="right"
                    >
                      {t("nav.syllabus")}
                    </ButtonLink>
                  ) : undefined
                }
              />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((session) => (
                  <li key={session.id}>
                    <UpcomingRow
                      session={session}
                      subject={subjectById.get(session.subjectId)}
                      now={now}
                      t={t}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <SectionBar title={t("classes.past")} hint={t("classes.pastHint")} />
            {past.length === 0 ? (
              <EmptyState
                icon="videocam"
                title={t("classes.nonePast")}
                body={t("classes.nonePastBody")}
              />
            ) : (
              <ul className="space-y-2">
                {past.map((session) => (
                  <li key={session.id}>
                    <PastRow session={session} subject={subjectById.get(session.subjectId)} t={t} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}

/**
 * A class that has not finished.
 *
 * The join button only claims to join when the live route would actually let
 * one through — fifteen minutes before the start, the same boundary
 * `/live/[sessionId]` enforces. Before that it is an ordinary link to the
 * class page, which explains the wait.
 */
function UpcomingRow({
  session,
  subject,
  now,
  t,
}: {
  session: ClassSession;
  subject?: Subject;
  now: number;
  t: Translator;
}) {
  const live = session.state === "live";
  const joinable = live || (session.state === "scheduled" && session.startsAt - now < 15 * 60 * 1000);

  return (
    <Card radius="md" className="flex flex-wrap items-center justify-between gap-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <IconBadge icon={live ? "live_tv" : "schedule"} tone={live ? "soft" : "dark"} size={40} round />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ict-fg">{session.title}</p>
          <p className="mt-0.5 truncate text-xs text-ict-fg-soft">
            {subject?.name ?? session.subjectId} · {formatSessionTime(session.startsAt)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {live ? (
          <StatusChip tone="danger">{t("classes.live")}</StatusChip>
        ) : (
          <span className="text-xs text-ict-fg-soft">{relativeToNow(session.startsAt, now)}</span>
        )}
        <ButtonLink
          href={`/live/${session.id}`}
          variant={joinable ? "primary" : "outline"}
          size="sm"
          arrow="right"
        >
          {joinable ? t("classes.join") : t("classes.open")}
        </ButtonLink>
      </div>
    </Card>
  );
}

/** A class that has finished — its replay, or an honest note that there is none. */
function PastRow({
  session,
  subject,
  t,
}: {
  session: ClassSession;
  subject?: Subject;
  t: Translator;
}) {
  return (
    <Card radius="md" className="flex flex-wrap items-center justify-between gap-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <IconBadge icon="videocam" tone="dark" size={40} round />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ict-fg">{session.title}</p>
          <p className="mt-0.5 truncate text-xs text-ict-fg-soft">
            {subject?.name ?? session.subjectId} · {formatSessionTime(session.startsAt)}
          </p>
        </div>
      </div>

      {session.replayUrl ? (
        <ButtonLink href={`/live/${session.id}`} variant="outline" size="sm" arrow="right">
          {t("classes.replay")}
        </ButtonLink>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-ict-fg-mute">
          <Icon name="schedule" className="!text-sm" />
          {t("classes.noReplay")}
        </span>
      )}
    </Card>
  );
}
