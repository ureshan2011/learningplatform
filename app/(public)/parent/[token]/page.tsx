import { col } from "@/lib/firebase/admin";
import { verifyParentLink } from "@/lib/auth/parent-link";
import { listEnrollments, listAttendance, getProgress, listSubjects } from "@/lib/queries";
import { formatDate, formatSessionTime } from "@/lib/format";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { Card, Eyebrow, StatCard, StatusChip } from "@/components/ds-cream";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Read-only parent dashboard. No sign-in — the link itself is the
 * credential, per `lib/auth/parent-link.ts`.
 *
 * Deliberately narrow: attendance and score trend only. No chat, no other
 * students' data, no way to change anything. It exists to answer the one
 * question a paying parent actually has — "is this working?" — not to be a
 * second student console.
 */
export default async function ParentViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verified = await verifyParentLink(token);

  if (!verified) {
    return (
      <>
        <SiteHeader user={null} />
        <main className="bg-ict-paper-100 px-5 py-16">
          <div className="mx-auto max-w-lg text-center">
            <h1 className="font-display text-xl font-extrabold tracking-[-0.02em] text-ict-ink-900">
              This link is no longer valid
            </h1>
            <p className="mt-3 text-sm text-ict-ink-400">
              Ask your child to open their account page and generate a new parent view link.
            </p>
          </div>
        </main>
      </>
    );
  }

  const [userSnap, enrollments, attendance, subjects] = await Promise.all([
    col.users().doc(verified.uid).get(),
    listEnrollments(verified.uid),
    listAttendance(verified.uid, 10),
    listSubjects(),
  ]);

  const user = userSnap.data() as User;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const progressBySubject = await Promise.all(
    enrollments.map((e) => getProgress(verified.uid, e.subjectId)),
  );

  // eslint-disable-next-line react-hooks/purity -- server component, one render per request
  const now = Date.now();
  const avgAttendance =
    attendance.length === 0
      ? null
      : Math.round(
          attendance.reduce((sum, a) => sum + (a.attendanceScore ?? 0), 0) / attendance.length,
        );

  return (
    <>
      <SiteHeader user={null} />
      <main className="bg-ict-paper-100 px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <Eyebrow className="flex items-center gap-1.5">
            <Icon name="family_restroom" className="!text-base" />
            Parent view
          </Eyebrow>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-ink-900">{user.name}</h1>
          <p className="mt-1 text-sm text-ict-ink-400">Read-only — attendance and progress only.</p>

          <section className="mt-8">
            <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-ink-900">Subjects</h2>
            {enrollments.length === 0 ? (
              <p className="mt-3 text-sm text-ict-ink-400">Not enrolled in any subject yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {enrollments.map((e, i) => {
                  const subject = subjectById.get(e.subjectId);
                  const active = e.status === "active" && e.currentPeriodEnd > now;
                  const progress = progressBySubject[i];
                  return (
                    <li key={e.id}>
                      <Card radius="card" className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-ict-ink-900">{subject?.name ?? e.subjectId}</p>
                          <StatusChip tone={active ? "success" : "neutral"} className="shrink-0">
                            {active ? `Active until ${formatDate(e.currentPeriodEnd)}` : "Not active"}
                          </StatusChip>
                        </div>
                        {progress ? (
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            <StatCard icon="local_fire_department" label="Streak" value={`${progress.streakDays}d`} />
                            <StatCard icon="grade" label="Level" value={progress.level} />
                            <StatCard icon="bolt" label="XP" value={progress.xp} />
                          </div>
                        ) : null}
                        {progress && progress.weakTopics.length > 0 ? (
                          <p className="mt-3 text-xs text-ict-ink-400">
                            Focus areas right now: {progress.weakTopics.join(", ")}
                          </p>
                        ) : null}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-ink-900">Recent attendance</h2>
            {avgAttendance !== null ? (
              <p className="mt-1 text-sm text-ict-ink-400">
                Average attendance score over the last {attendance.length} classes:{" "}
                <span className="font-semibold text-ict-ink-900">{avgAttendance}%</span>
              </p>
            ) : null}
            {attendance.length === 0 ? (
              <p className="mt-3 text-sm text-ict-ink-400">No classes attended yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {attendance.map((a) => (
                  <li key={`${a.sessionId}_${a.joinedAt}`}>
                    <Card radius="md" className="flex items-center justify-between p-3">
                      <span className="text-ict-ink-400">
                        {a.joinedAt ? formatSessionTime(a.joinedAt) : "—"}
                      </span>
                      <span className="text-ict-ink-400">{a.minutesPresent} min present</span>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
