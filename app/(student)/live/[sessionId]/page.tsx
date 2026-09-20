import { notFound } from "next/navigation";
import { requirePageUser, isStaff } from "@/lib/auth/session";
import { getSession, getSubject } from "@/lib/queries";
import { formatSessionTime, relativeToNow } from "@/lib/format";
import { JoinClass } from "@/components/live/JoinClass";
import { LiveArena } from "@/components/live/LiveArena";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink, Card, PageHeader, StatusChip } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const user = await requirePageUser(`/live/${sessionId}`);
  const t = await getT();

  const session = await getSession(sessionId);
  if (!session) notFound();

  const subject = await getSubject(session.subjectId);
  // Server Component: this renders once per request, so reading the clock here
  // is deterministic for that render. The purity rule targets client renders.
  // eslint-disable-next-line react-hooks/purity
  const startsSoon = session.startsAt - Date.now() < 15 * 60 * 1000;
  const joinable = session.state === "live" || (session.state === "scheduled" && startsSoon);

  return (
    <PageShell>
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

      {/* The video and the room, side by side on a laptop and stacked on a
          phone. One layout for both delivery modes, so a student on the
          simulcast sits in the same room as one in the Zoom call. */}
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="min-w-0">
          {joinable ? (
            <JoinClass sessionId={sessionId} />
          ) : session.state === "ended" ? (
            <EndedPanel replayUrl={session.replayUrl} subjectId={session.subjectId} />
          ) : (
            <Card radius="card" className="flex min-h-[240px] items-center justify-center p-6 text-center text-sm text-ict-fg-soft">
              <div>
                <Icon name="schedule" className="mx-auto !text-3xl text-ict-fg-soft" />
                <p className="mt-2 text-ict-fg">This class has not started yet.</p>
                <p className="mt-1">The join button opens 15 minutes before the start time.</p>
              </div>
            </Card>
          )}
        </div>

        {/* Only while the class is actually on. A room with nobody in it, on a
            class that finished last week, is noise — and every student who
            opens a replay would otherwise register presence in it. */}
        {joinable ? (
          <LiveArena
            sessionId={sessionId}
            me={{ uid: user.uid, name: user.name }}
            staff={isStaff(user.role)}
            labels={{
              quizTab: t("live.quizTab"),
              chatTab: t("live.chatTab"),
              quizWaiting: t("live.quizWaiting"),
              quizClosed: t("live.quizClosed"),
              leaderboard: t("live.leaderboard"),
              seconds: t("live.seconds"),
              chatEmpty: t("live.chatEmpty"),
              chatPlaceholder: t("live.chatPlaceholder"),
              tooFast: t("live.tooFast"),
              notConfigured: t("live.notConfigured"),
              teacherControls: t("live.teacherControls"),
              questionId: t("live.questionId"),
              askQuestion: t("live.askQuestion"),
              closeQuestion: t("live.closeQuestion"),
              clear: t("live.clear"),
              raiseHand: t("live.raiseHand"),
              handRaised: t("live.handRaised"),
              lowerHand: t("live.lowerHand"),
              hands: t("live.hands"),
              dismissHand: t("live.dismissHand"),
            }}
          />
        ) : null}
      </div>
    </PageShell>
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
