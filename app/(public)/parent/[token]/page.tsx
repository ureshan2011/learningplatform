import { col } from "@/lib/firebase/admin";
import { verifyParentLink } from "@/lib/auth/parent-link";
import { listEnrollments, listAttendance, getProgress, listSubjects } from "@/lib/queries";
import { formatDate, formatSessionTime } from "@/lib/format";
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
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-xl font-bold">This link is no longer valid</h1>
        <p className="mt-3 text-sm text-white/60">
          Ask your child to open their account page and generate a new parent view link.
        </p>
      </main>
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
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="text-xs uppercase tracking-wide text-white/40">Parent view</p>
      <h1 className="mt-1 text-2xl font-bold">{user.name}</h1>
      <p className="mt-1 text-sm text-white/55">Read-only — attendance and progress only.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Subjects</h2>
        {enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Not enrolled in any subject yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {enrollments.map((e, i) => {
              const subject = subjectById.get(e.subjectId);
              const active = e.status === "active" && e.currentPeriodEnd > now;
              const progress = progressBySubject[i];
              return (
                <li key={e.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{subject?.name ?? e.subjectId}</p>
                    <span className={active ? "text-sm text-[--color-success]" : "text-sm text-white/45"}>
                      {active ? `Active until ${formatDate(e.currentPeriodEnd)}` : "Not active"}
                    </span>
                  </div>
                  {progress ? (
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
                      <Stat label="Streak" value={`${progress.streakDays}d`} />
                      <Stat label="Level" value={String(progress.level)} />
                      <Stat label="XP" value={String(progress.xp)} />
                    </div>
                  ) : null}
                  {progress && progress.weakTopics.length > 0 ? (
                    <p className="mt-3 text-xs text-white/50">
                      Focus areas right now: {progress.weakTopics.join(", ")}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Recent attendance</h2>
        {avgAttendance !== null ? (
          <p className="mt-1 text-sm text-white/55">
            Average attendance score over the last {attendance.length} classes:{" "}
            <span className="font-semibold text-white">{avgAttendance}%</span>
          </p>
        ) : null}
        {attendance.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">No classes attended yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {attendance.map((a) => (
              <li
                key={`${a.sessionId}_${a.joinedAt}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <span className="text-white/70">
                  {a.joinedAt ? formatSessionTime(a.joinedAt) : "—"}
                </span>
                <span className="text-white/50">{a.minutesPresent} min present</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 py-2">
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
    </div>
  );
}
