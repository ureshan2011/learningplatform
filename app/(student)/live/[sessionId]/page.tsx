import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSession, getSubject } from "@/lib/queries";
import { formatSessionTime, relativeToNow } from "@/lib/format";
import { JoinClass } from "@/components/live/JoinClass";
import { SiteHeader } from "@/components/nav/SiteHeader";

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
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/dashboard" className="text-sm text-(--color-awaken-ink-soft) underline">
        ← Dashboard
      </Link>

      <header className="mt-4">
        <h1 className="text-xl font-bold sm:text-2xl">{session.title}</h1>
        <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
          {subject?.name ?? session.subjectId} · {session.topic}
        </p>
        <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">
          {formatSessionTime(session.startsAt)}
          <span className={session.state === "live" ? "ml-2 text-(--color-awaken-success)" : "ml-2 text-(--color-awaken-ink-soft)"}>
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
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 text-center text-sm text-(--color-awaken-ink-soft)">
            <div>
              <p>This class has not started yet.</p>
              <p className="mt-1 text-(--color-awaken-ink-soft)">
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
    </>
  );
}

function EndedPanel({ replayUrl, subjectId }: { replayUrl?: string; subjectId: string }) {
  return (
    <div className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 text-center text-sm text-(--color-awaken-ink-soft)">
      <p>This class has ended.</p>
      {replayUrl ? (
        // Replays are published as content items on the subject page, so there
        // is one gated download path rather than two.
        <Link
          href={`/subjects/${subjectId}`}
          className="mt-4 inline-block rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 font-semibold text-white"
        >
          Watch the replay
        </Link>
      ) : (
        <p className="mt-1 text-(--color-awaken-ink-soft)">The replay will appear here once it is processed.</p>
      )}
    </div>
  );
}
