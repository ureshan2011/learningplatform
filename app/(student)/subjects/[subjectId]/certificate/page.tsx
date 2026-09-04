import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getCertificateEligibility } from "@/lib/practice/engine";
import { publicEnv } from "@/lib/env";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";

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

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href={`/subjects/${subjectId}`} className="inline-flex items-center gap-1 text-sm text-(--color-awaken-ink-soft) underline">
        <Icon name="arrow_back" className="!text-base" />
        {subject.name}
      </Link>

      <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <Icon name="military_tech" className="text-(--color-awaken-accent)" />
        Certificate
      </h1>

      {eligibility.eligible ? (
        <div className="mt-6">
          {/*
            Deliberately a plain <img>, not next/image: the optimizer caches
            by URL alone, and this URL is the same for every student who
            unlocks this subject's certificate. Routing it through the
            optimizer risks one student's cached, personalised PNG being
            served to another — the auth check on every request is what
            keeps this correct.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${subject.name} Practice Mastery certificate for ${user.name}`}
            className="w-full rounded-xl border border-(--color-awaken-line)"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={imageUrl}
              download={`ict-campus-${subject.id}-certificate.png`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white"
            >
              <Icon name="download" className="!text-base" />
              Download certificate
            </a>
            <WhatsAppShareButton
              text={`I just earned a Practice Mastery certificate in ${subject.name} on ICT Campus! 🎓 ${publicEnv.appUrl}`}
              label="Share the news"
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 text-sm">
          <p className="text-(--color-awaken-ink-soft)">
            Answer <strong>{eligibility.requiredQuestions}</strong> practice questions with at
            least <strong>{eligibility.requiredAccuracyPct}%</strong> accuracy to unlock your
            certificate for {subject.name}.
          </p>
          <div className="mt-4">
            <p className="flex justify-between text-xs text-(--color-awaken-ink-soft)">
              <span>Questions answered</span>
              <span>
                {eligibility.questionsAnswered}/{eligibility.requiredQuestions}
              </span>
            </p>
            <div className="mt-1.5">
              <ProgressBar percent={(eligibility.questionsAnswered / eligibility.requiredQuestions) * 100} />
            </div>
          </div>
          {eligibility.questionsAnswered > 0 ? (
            <p className="mt-4 text-(--color-awaken-ink-soft)">
              Current accuracy: <strong className="text-(--color-awaken-ink)">{eligibility.accuracyPct}%</strong>
            </p>
          ) : null}
          <Link
            href={`/subjects/${subjectId}/practice`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 font-semibold text-white"
          >
            <Icon name="quiz" className="!text-base" />
            Go to Practice
          </Link>
        </div>
      )}
    </main>
  );
}
