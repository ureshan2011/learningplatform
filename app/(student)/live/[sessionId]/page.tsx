import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSession, getSubject } from "@/lib/queries";
import { formatSessionTime, relativeToNow } from "@/lib/format";
import { JoinClass } from "@/components/live/JoinClass";
import { TopBar } from "@/components/ui/TopBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveDot } from "@/components/ui/LiveDot";

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
    <main className="min-h-dvh">
      <TopBar back={{ href: "/dashboard", label: "Dashboard" }} maxWidth="6xl" />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="rise-in">
          <h1 className="text-display text-xl sm:text-2xl">{session.title}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            {subject?.name ?? session.subjectId} · {session.topic}
          </p>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            {formatSessionTime(session.startsAt)}{" "}
            {session.state === "live" ? (
              <LiveDot />
            ) : (
              <span className="text-(--color-text-faint)">{relativeToNow(session.startsAt)}</span>
            )}
          </p>
        </header>

        <div className="mt-6">
          {joinable ? (
            <JoinClass sessionId={sessionId} />
          ) : session.state === "ended" ? (
            <EndedPanel replayUrl={session.replayUrl} subjectId={session.subjectId} />
          ) : (
            <EmptyState>
              <p>This class has not started yet.</p>
              <p className="mt-1 text-(--color-text-faint)">
                The join button opens 15 minutes before the start time.
              </p>
            </EmptyState>
          )}
        </div>

        {/*
          Phase 2 mounts the Live Arena here — quizzes, leaderboard, chat, raise
          hand — sharing this layout so simulcast and Zoom students sit in the
          same room.
        */}
      </div>
    </main>
  );
}

function EndedPanel({ replayUrl, subjectId }: { replayUrl?: string; subjectId: string }) {
  return (
    <EmptyState>
      <p>This class has ended.</p>
      {replayUrl ? (
        // Replays are published as content items on the subject page, so there
        // is one gated download path rather than two.
        <Link href={`/subjects/${subjectId}`} className="btn btn-primary mt-4">
          Watch the replay
        </Link>
      ) : (
        <p className="mt-1 text-(--color-text-faint)">
          The replay will appear here once it is processed.
        </p>
      )}
    </EmptyState>
  );
}
