import { redirect } from "next/navigation";
import { adminDb, col } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { publicEnv } from "@/lib/env";
import { formatLKR, formatSessionTime } from "@/lib/format";
import { ScheduleSessionForm } from "@/components/teacher/ScheduleSessionForm";
import { SlipReviewList, type PendingSlip } from "@/components/teacher/SlipReviewList";
import { SeedSubjectsButton } from "@/components/teacher/SeedSubjectsButton";
import { NotConfigured } from "@/components/ui/NotConfigured";
import { zoomConfigured } from "@/lib/features";
import type { ClassSession, Payment, SessionSecrets, User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TeacherConsolePage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  if (user.role !== "teacher" && user.role !== "admin") redirect("/dashboard");

  const [subjects, sessions, slips] = await Promise.all([
    listSubjects(),
    upcomingSessions(),
    pendingSlips(),
  ]);

  // Start URLs are read here, server-side, and rendered only into this
  // teacher-gated page. They never touch a student-readable document.
  const startUrls = await startUrlsFor(sessions.map((s) => s.id));

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-bold">Teacher console</h1>
      <p className="mt-1 text-sm text-white/50">Schedule classes and approve payments.</p>

      {subjects.length === 0 ? (
        <div className="mt-8">
          <SeedSubjectsButton />
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Schedule a class</h2>
        {zoomConfigured() ? (
          <div className="mt-4">
            <ScheduleSessionForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
          </div>
        ) : (
          <div className="mt-4">
            <NotConfigured feature="zoom" forTeacher />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Upcoming classes</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Nothing scheduled.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{session.title}</p>
                  <p className="mt-0.5 text-sm text-white/50">
                    {formatSessionTime(session.startsAt)} · {session.durationMinutes} min
                    {session.hlsUrl ? " · simulcast on" : " · no simulcast"}
                  </p>
                </div>
                {startUrls[session.id] ? (
                  <a
                    href={startUrls[session.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-[--color-brand] px-4 py-2 text-sm font-semibold text-black"
                  >
                    Start class
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Bank slips awaiting approval</h2>
        <p className="mt-1 text-sm text-white/45">
          Approving grants one month of access from today.
        </p>
        <SlipReviewList slips={slips} />
      </section>
    </main>
  );
}

async function upcomingSessions(): Promise<ClassSession[]> {
  const snap = await col
    .sessions()
    .where("tenantId", "==", publicEnv.tenantId)
    .where("startsAt", ">=", Date.now() - 3 * 60 * 60 * 1000)
    .orderBy("startsAt", "asc")
    .limit(20)
    .get();
  return snap.docs.map((d) => d.data() as ClassSession);
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

async function pendingSlips(): Promise<PendingSlip[]> {
  const snap = await col
    .payments()
    .where("tenantId", "==", publicEnv.tenantId)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const payments = snap.docs
    .map((d) => d.data() as Payment)
    .filter((p) => p.provider === "bank_slip");

  if (payments.length === 0) return [];

  // One batched read for the student names rather than a query per slip.
  const userRefs = [...new Set(payments.map((p) => p.uid))].map((uid) =>
    col.users().doc(uid),
  );
  const userSnaps = await adminDb().getAll(...userRefs);
  const nameByUid = new Map(
    userSnaps.map((s) => [s.id, (s.data() as User | undefined)?.name ?? "Unknown"]),
  );

  return payments.map((p) => ({
    id: p.id,
    studentName: nameByUid.get(p.uid) ?? "Unknown",
    subjectId: p.subjectId,
    amount: formatLKR(p.amountLKR),
    slipUrl: p.slipUrl ?? "",
    submittedAt: formatSessionTime(p.createdAt),
  }));
}
