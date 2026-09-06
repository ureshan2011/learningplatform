import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSession, getSubject } from "@/lib/queries";
import { formatSessionTime, relativeToNow } from "@/lib/format";
import { JoinClass } from "@/components/live/JoinClass";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink, Card, PageHeader, StatusChip } from "@/components/ds";

export const dynamic = "force-dynamic";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  // Gate only — the page renders the same for every signed-in student.
  await requirePageUser(`/live/${sessionId}`);

  const session = await getSession(sessionId);
  if (!session) notFound();

  const subject = await getSubject(session.subjectId);
  // Server Component: this renders once per request, so reading the clock here
  // is deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const startsSoon = session.startsAt - Date.now() < 15 * 60 * 1000;
  const joinable = session.state === "live" || (session.state === "scheduled" && startsSoon);

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        eyebrow={`${subject?.name ?? session.subjectId} · ${session.topic}`}
        title={session.title}
        subtitle={formatSessionTime(session.startsAt)}
        actions={
          <StatusChip tone={session.state === "live" ? "success" : session.state === "ended" ? "neutral" : "info"}>
            {session.state === "live" ? "Live now" : session.state === "ended" ? "Ended" : relativeToNow(session.startsAt)}
          </StatusChip>
        }
      />

      <div className="mt-5">
        {joinable ? (
          <JoinClass sessionId={sessionId} />
        ) : session.state === "ended" ? (
          <EndedPanel replayUrl={session.replayUrl} subjectId={session.subjectId} />
        ) : (
          <Card radius="card" className="flex min-h-[240px] items-center justify-center p-6 text-center text-sm text-ict-ink-300">
            <div>
              <Icon name="schedule" className="mx-auto !text-3xl text-ict-ink-300" />
              <p className="mt-2 text-ict-paper-50">This class has not started yet.</p>
              <p className="mt-1">The join button opens 15 minutes before the start time.</p>
            </div>
          </Card>
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
    <Card radius="card" className="flex min-h-[240px] flex-col items-center justify-center p-6 text-center text-sm text-ict-ink-300">
      <Icon name="check_circle" className="!text-3xl text-ict-green-500" />
      <p className="mt-2 text-ict-paper-50">This class has ended.</p>
      {replayUrl ? (
        // Replays are published as content items on the subject page, so there
        // is one gated download path rather than two.
        <ButtonLink href={`/subjects/${subjectId}`} arrow="right" className="mt-4">
          Watch the replay
        </ButtonLink>
      ) : (
        <p className="mt-1">The replay will appear here once it is processed.</p>
      )}
    </Card>
  );
}
