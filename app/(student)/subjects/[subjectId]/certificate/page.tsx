import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getCertificateEligibility } from "@/lib/practice/engine";
import { publicEnv } from "@/lib/env";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { SubjectPageShell } from "@/components/subject/SubjectShell";
import { ButtonLink, Card, Eyebrow, ProgressBar, StatusChip } from "@/components/ds";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await requirePageUser(`/subjects/${subjectId}/certificate`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) redirect(`/subjects/${subjectId}`);

  const eligibility = await getCertificateEligibility(user.uid, subjectId);
  const imageUrl = `/api/certificate/${subjectId}`;
  const answeredPct = Math.min(
    100,
    (eligibility.questionsAnswered / eligibility.requiredQuestions) * 100,
  );

  return (
    <SubjectPageShell
      subjectId={subjectId}
      subjectName={subject.name}
      title="Certificate"
      subtitle="Proof you have practised this subject to the mastery bar."
      access={access}
      lockedBody="Earn a Practice Mastery certificate for this subject."
    >
      <div className="mx-auto max-w-2xl">
        {eligibility.eligible ? (
          <Card radius="card" className="p-5">
            <StatusChip tone="success">Earned</StatusChip>
            {/*
              Deliberately a plain <img>, not next/image: the optimizer caches
              by URL alone, and this URL is the same for every student who
              unlocks this subject's certificate. Routing it through the
              optimizer risks one student's cached, personalised PNG being
              served to another — the auth check on every request is what keeps
              this correct.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${subject.name} Practice Mastery certificate for ${user.name}`}
              className="mt-4 w-full rounded-ict-md border border-ict-border-dark"
            />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={imageUrl}
                download={`ict-campus-${subject.id}-certificate.png`}
                className="ict-press inline-flex h-10 items-center gap-2.5 rounded-full bg-ict-orange-500 pr-1.5 pl-5 text-sm font-semibold text-white shadow-ict-brand transition-colors duration-[120ms] hover:bg-ict-orange-600"
              >
                <span>Download certificate</span>
                <span className="grid size-[26px] place-items-center rounded-full bg-white text-ict-orange-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="size-[0.85em] rotate-90"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              </a>
              <WhatsAppShareButton
                text={`I earned a Practice Mastery certificate in ${subject.name} on ICT Campus. ${publicEnv.appUrl}`}
                label="Share the news"
              />
            </div>
          </Card>
        ) : (
          <Card radius="card" className="p-6">
            <Eyebrow>Not unlocked yet</Eyebrow>
            <h2 className="mt-2 font-display text-xl font-extrabold text-ict-paper-50">
              {eligibility.requiredQuestions - eligibility.questionsAnswered} question
              {eligibility.requiredQuestions - eligibility.questionsAnswered === 1 ? "" : "s"} to go
            </h2>
            <p className="mt-2 text-sm text-ict-ink-300">
              Answer {eligibility.requiredQuestions} practice questions at{" "}
              {eligibility.requiredAccuracyPct}% accuracy or better to unlock your certificate for{" "}
              {subject.name}.
            </p>

            <div className="mt-5">
              <div className="flex justify-between text-xs text-ict-ink-300">
                <span>Questions answered</span>
                <span className="tabular-nums">
                  {eligibility.questionsAnswered} / {eligibility.requiredQuestions}
                </span>
              </div>
              <ProgressBar value={answeredPct} showLabel={false} className="mt-2" />
            </div>

            {eligibility.questionsAnswered > 0 ? (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-ict-ink-300">Current accuracy</span>
                <StatusChip
                  tone={eligibility.accuracyPct >= eligibility.requiredAccuracyPct ? "success" : "warning"}
                >
                  {eligibility.accuracyPct}%
                </StatusChip>
              </div>
            ) : null}

            <ButtonLink href={`/subjects/${subjectId}/practice`} arrow="right" className="mt-6">
              Go to Practice
            </ButtonLink>
          </Card>
        )}
      </div>
    </SubjectPageShell>
  );
}
