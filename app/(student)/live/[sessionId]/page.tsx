import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSession, getSubject } from "@/lib/queries";
import { formatSessionTime, relativeToNow } from "@/lib/format";
import { JoinClass } from "@/components/live/JoinClass";

export const dynamic = "force-dynamic";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/live/${sessionId}`);

  const session = await getSession(sessionId);
  if (!session) notFound();

  const subject = await getSubject(session.subjectId);
  // Server Component: this renders once per request, so reading the clock here
  // is deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const startsSoon = session.startsAt - Date.now() < 15 * 60 * 1000;
  const joinable = session.state === "live" || (session.state === "scheduled" && startsSoon);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/dashboard" className="text-sm text-white/50 underline">
        ← Dashboard
      </Link>

      <header className="mt-4">
        <h1 className="text-xl font-bold sm:text-2xl">{session.title}</h1>
        <p className="mt-1 text-sm text-white/55">
          {subject?.name ?? session.subjectId} · {session.topic}
        </p>
        <p className="mt-1 text-sm text-white/70">
          {formatSessionTime(session.startsAt)}
          <span className={session.state === "live" ? "ml-2 text-[--color-success]" : "ml-2 text-white/45"}>
            {session.state === "live" ? "● live now" : relativeToNow(session.startsAt)}
          </span>
        </p>
      </header>

      <div className="mt-6">
        {joinable ? (
          <JoinClass sessionId={sessionId} />
        ) : session.state === "ended" ? (
          <EndedPanel replayUrl={session.replayUrl} subjectId={session.subjectId} />
        ) : (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
            <div>
              <p>This class has not started yet.</p>
              <p className="mt-1 text-white/40">
                The join button opens 15 minutes before the start time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/*
        Phase 2 mounts the Live Arena here — quizzes, leaderboard, chat, raise
        hand — sharing this layout so simulcast and Zoom students sit in the
        same room.
      */}
    </main>
  );
}

function EndedPanel({ replayUrl, subjectId }: { replayUrl?: string; subjectId: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
      <p>This class has ended.</p>
      {replayUrl ? (
        // Replays are published as content items on the subject page, so there
        // is one gated download path rather than two.
        <Link
          href={`/subjects/${subjectId}`}
          className="mt-4 inline-block rounded-lg bg-[--color-brand] px-4 py-2 font-semibold text-black"
        >
          Watch the replay
        </Link>
      ) : (
        <p className="mt-1 text-white/40">The replay will appear here once it is processed.</p>
      )}
    </div>
  );
}
