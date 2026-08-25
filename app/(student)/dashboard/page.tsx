import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listEnrollments, listSubjects, listUpcomingSessions } from "@/lib/queries";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { payhereConfigured } from "@/lib/features";

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

  const sessions = await listUpcomingSessions(activeSubjectIds);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const cardPaymentsOn = payhereConfigured();
  const isStaff = user.role === "teacher" || user.role === "admin";

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
      <header>
        <h1 className="text-2xl font-bold">Hi, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-(--color-awaken-ink-soft)">Your classes and timetable</p>
      </header>

      {/*
        The teacher console had no link anywhere, so the owner had to know to
        type /teacher. Somewhere you can only reach by guessing the URL may as
        well not exist.
      */}
      {isStaff ? (
        <Link
          href="/teacher"
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-4"
        >
          <span>
            <span className="block font-semibold text-(--color-awaken-accent)">Teacher console</span>
            <span className="block text-sm text-(--color-awaken-ink-soft)">
              Schedule classes, approve payments, manage subjects
            </span>
          </span>
          <span aria-hidden className="text-xl text-(--color-awaken-accent)">→</span>
        </Link>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Next classes</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 text-sm text-(--color-awaken-ink-soft)">
            {activeSubjectIds.length === 0
              ? "You have no active class yet. Pick a subject below to get started."
              : "No classes scheduled right now. Your teacher will add the next one soon."}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sessions.map((session) => {
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
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Your subjects</h2>
        <ul className="mt-3 space-y-3">
          {subjects.map((subject) => {
            const enrollment = enrollments.find((e) => e.subjectId === subject.id);
            const active = enrollment?.status === "active" && enrollment.currentPeriodEnd > now;
            return (
              <li
                key={subject.id}
                className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{subject.name}</p>
                    <p className="mt-0.5 text-sm text-(--color-awaken-ink-soft)">
                      {active
                        ? `Paid until ${formatSessionTime(enrollment.currentPeriodEnd)}`
                        : `${formatLKR(subject.priceLKR)} per month`}
                    </p>
                  </div>
                  {active ? (
                    <Link
                      href={`/subjects/${subject.id}`}
                      className="rounded-lg border border-(--color-awaken-line) px-4 py-2 text-sm"
                    >
                      Notes &amp; papers
                    </Link>
                  ) : cardPaymentsOn ? (
                    <SubscribeButton subjectId={subject.id} />
                  ) : (
                    // No card payments yet — bank deposit is how most Sri Lankan
                    // parents pay anyway, so this is a working path, not a stub.
                    <Link
                      href="/pay/slip"
                      className="rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white"
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
      </main>
    </>
  );
}
