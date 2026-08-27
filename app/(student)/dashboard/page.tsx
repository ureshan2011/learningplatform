import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listEnrollments, listSubjects, listUpcomingSessions, getProgress } from "@/lib/queries";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { payhereConfigured } from "@/lib/features";
import { Icon } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StatTile";
import { StatusPill } from "@/components/ui/StatusPill";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  const [enrollments, subjects] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
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
  const cardPaymentsOn = payhereConfigured();
  const isStaff = user.role === "teacher" || user.role === "admin";

  const streakDays = progressList.reduce((max, p) => Math.max(max, p?.streakDays ?? 0), 0);
  const totalXp = progressList.reduce((sum, p) => sum + (p?.xp ?? 0), 0);

  const [heroSession, ...restSessions] = sessions;
  const heroSubject = heroSession ? subjectById.get(heroSession.subjectId) : undefined;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
            Here&apos;s a summary of your classes and progress.
          </p>
        </div>
      </header>

      {isStaff ? (
        <Link
          href="/teacher"
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-4"
        >
          <span className="flex items-center gap-3">
            <Icon name="workspace_premium" className="text-(--color-awaken-accent)" />
            <span>
              <span className="block font-semibold text-(--color-awaken-accent)">Teacher console</span>
              <span className="block text-sm text-(--color-awaken-ink-soft)">
                Schedule classes, approve payments, manage subjects
              </span>
            </span>
          </span>
          <Icon name="chevron_right" className="text-(--color-awaken-accent)" />
        </Link>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon="school" label="Subjects" value={activeSubjectIds.length} tone="accent" />
        <StatTile icon="event" label="Upcoming classes" value={sessions.length} />
        <StatTile icon="local_fire_department" label="Streak" value={`${streakDays}d`} tone={streakDays > 0 ? "warn" : "default"} />
        <StatTile icon="bolt" label="XP" value={totalXp} tone={totalXp > 0 ? "success" : "default"} />
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="videocam" className="text-(--color-awaken-accent)" />
          Next class
        </h2>

        {!heroSession ? (
          <p className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
            {activeSubjectIds.length === 0
              ? "You have no active class yet. Pick a subject below to get started."
              : "No classes scheduled right now. Your teacher will add the next one soon."}
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:flex">
            <div className="flex items-center justify-center bg-gradient-to-br from-(--color-awaken-accent) to-(--color-awaken-rose) p-8 text-white sm:w-56 sm:shrink-0">
              <Icon name="videocam" className="!text-5xl" />
            </div>
            <div className="flex-1 p-5">
              <span className="inline-flex items-center rounded-full bg-(--color-awaken-accent-soft) px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-(--color-awaken-accent)">
                {heroSubject?.name ?? heroSession.subjectId}
              </span>
              <h3 className="mt-2 text-lg font-bold">{heroSession.title}</h3>
              <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">{heroSession.topic}</p>
              <p className="mt-3 text-sm">
                {formatSessionTime(heroSession.startsAt)}
                <span className={heroSession.state === "live" ? "ml-2 font-semibold text-(--color-awaken-success)" : "ml-2 text-(--color-awaken-ink-soft)"}>
                  {heroSession.state === "live" ? "● live now" : relativeToNow(heroSession.startsAt)}
                </span>
              </p>
              <Link
                href={`/live/${heroSession.id}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(234,88,12,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icon name="videocam" className="!text-base" />
                {heroSession.state === "live" ? "Join now" : "Open"}
              </Link>
            </div>
          </div>
        )}

        {restSessions.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {restSessions.map((session) => {
              const subject = subjectById.get(session.subjectId);
              const isLive = session.state === "live";
              return (
                <li
                  key={session.id}
                  className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{session.title}</p>
                      <p className="mt-0.5 truncate text-sm text-(--color-awaken-ink-soft)">
                        {subject?.name ?? session.subjectId} · {session.topic}
                      </p>
                      <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
                        {formatSessionTime(session.startsAt)}
                        <span className={isLive ? "ml-2 text-(--color-awaken-success)" : "ml-2 text-(--color-awaken-ink-soft)"}>
                          {isLive ? "● live now" : relativeToNow(session.startsAt)}
                        </span>
                      </p>
                    </div>
                    <Link
                      href={`/live/${session.id}`}
                      className="shrink-0 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white"
                    >
                      {isLive ? "Join" : "Open"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon name="auto_stories" className="text-(--color-awaken-accent)" />
          Your subjects
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {subjects.map((subject) => {
            const enrollment = enrollments.find((e) => e.subjectId === subject.id);
            const active = enrollment?.status === "active" && enrollment.currentPeriodEnd > now;
            return (
              <li
                key={subject.id}
                className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{subject.name}</p>
                      <StatusPill tone={active ? "success" : "neutral"}>{subject.grade}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
                      {active
                        ? `Paid until ${formatSessionTime(enrollment.currentPeriodEnd)}`
                        : `${formatLKR(subject.priceLKR)} per month`}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  {active ? (
                    <Link
                      href={`/subjects/${subject.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm font-medium hover:border-(--color-awaken-accent)/40"
                    >
                      <Icon name="description" className="!text-base" />
                      Notes &amp; papers
                    </Link>
                  ) : cardPaymentsOn ? (
                    <SubscribeButton subjectId={subject.id} />
                  ) : (
                    // No card payments yet — bank deposit is how most Sri Lankan
                    // parents pay anyway, so this is a working path, not a stub.
                    <Link
                      href="/pay/slip"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white"
                    >
                      Pay by bank slip
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10 pb-4">
        <h2 className="text-lg font-semibold">Free resources</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/notes"
            className="flex items-center gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 hover:border-(--color-awaken-accent)/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-awaken-accent-soft) text-(--color-awaken-accent)">
              <Icon name="description" />
            </span>
            <span>
              <span className="block font-semibold">Free notes</span>
              <span className="block text-sm text-(--color-awaken-ink-soft)">Open notes and past papers</span>
            </span>
          </Link>
          <Link
            href="/command-words"
            className="flex items-center gap-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 hover:border-(--color-awaken-accent)/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-awaken-indigo-soft) text-(--color-awaken-indigo)">
              <Icon name="quiz" />
            </span>
            <span>
              <span className="block font-semibold">Command words</span>
              <span className="block text-sm text-(--color-awaken-ink-soft)">
                What &quot;state&quot;, &quot;explain&quot; and &quot;justify&quot; actually want
              </span>
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
