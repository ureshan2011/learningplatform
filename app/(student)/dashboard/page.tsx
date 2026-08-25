import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listEnrollments, listSubjects, listUpcomingSessions } from "@/lib/queries";
import { formatLKR, formatSessionTime, relativeToNow } from "@/lib/format";
import { SubscribeButton } from "@/components/payments/SubscribeButton";
import { payhereConfigured } from "@/lib/features";
import { TopBar } from "@/components/ui/TopBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveDot } from "@/components/ui/LiveDot";

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
    <main className="min-h-dvh">
      <TopBar
        trailing={
          <Link href="/account" className="btn btn-ghost btn-sm">
            Account
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl px-5 py-8">
        <header className="rise-in">
          <h1 className="text-display text-2xl">Hi, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-(--color-text-muted)">Your classes and timetable</p>
        </header>

        {/*
          The teacher console had no link anywhere, so the owner had to know to
          type /teacher. Somewhere you can only reach by guessing the URL may as
          well not exist.
        */}
        {isStaff ? (
          <Link
            href="/teacher"
            className="surface surface-interactive mt-6 flex items-center justify-between gap-4 border-(--color-brand)/30 bg-(--color-brand)/[0.08] p-4"
          >
            <span>
              <span className="block font-semibold text-(--color-brand)">Teacher console</span>
              <span className="block text-sm text-(--color-text-muted)">
                Schedule classes, approve payments, manage subjects
              </span>
            </span>
            <span aria-hidden className="text-xl text-(--color-brand)">
              →
            </span>
          </Link>
        ) : null}

        <section className="mt-8">
          <h2 className="text-title text-lg">Next classes</h2>
          {sessions.length === 0 ? (
            <div className="mt-3">
              <EmptyState>
                {activeSubjectIds.length === 0
                  ? "You have no active class yet. Pick a subject below to get started."
                  : "No classes scheduled right now. Your teacher will add the next one soon."}
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {sessions.map((session) => {
                const subject = subjectById.get(session.subjectId);
                const isLive = session.state === "live";
                return (
                  <li key={session.id} className="surface p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{session.title}</p>
                        <p className="mt-0.5 truncate text-sm text-(--color-text-muted)">
                          {subject?.name ?? session.subjectId} · {session.topic}
                        </p>
                        <p className="mt-2 text-sm text-(--color-text-muted)">
                          {formatSessionTime(session.startsAt)}{" "}
                          {isLive ? (
                            <LiveDot />
                          ) : (
                            <span className="text-(--color-text-faint)">{relativeToNow(session.startsAt)}</span>
                          )}
                        </p>
                      </div>
                      <Link href={`/live/${session.id}`} className="btn btn-primary btn-sm shrink-0">
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
          <h2 className="text-title text-lg">Your subjects</h2>
          <ul className="mt-3 space-y-3">
            {subjects.map((subject) => {
              const enrollment = enrollments.find((e) => e.subjectId === subject.id);
              const active = enrollment?.status === "active" && enrollment.currentPeriodEnd > now;
              return (
                <li key={subject.id} className="surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{subject.name}</p>
                      <p className="mt-0.5 text-sm text-(--color-text-muted)">
                        {active
                          ? `Paid until ${formatSessionTime(enrollment.currentPeriodEnd)}`
                          : `${formatLKR(subject.priceLKR)} per month`}
                      </p>
                    </div>
                    {active ? (
                      <Link href={`/subjects/${subject.id}`} className="btn btn-secondary btn-sm">
                        Notes &amp; papers
                      </Link>
                    ) : cardPaymentsOn ? (
                      <SubscribeButton subjectId={subject.id} />
                    ) : (
                      // No card payments yet — bank deposit is how most Sri Lankan
                      // parents pay anyway, so this is a working path, not a stub.
                      <Link href="/pay/slip" className="btn btn-primary btn-sm">
                        Pay by bank slip
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
