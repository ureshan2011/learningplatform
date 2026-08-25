import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSubject } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getCertificateEligibility } from "@/lib/practice/engine";
import { publicEnv } from "@/lib/env";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/subjects/${subjectId}/certificate`);

  const subject = await getSubject(subjectId);
  if (!subject) notFound();

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) redirect(`/subjects/${subjectId}`);

  const eligibility = await getCertificateEligibility(user.uid, subjectId);
  const imageUrl = `/api/certificate/${subjectId}`;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href={`/subjects/${subjectId}`} className="text-sm text-white/50 underline">
        ← {subject.name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Certificate</h1>

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
            className="w-full rounded-xl border border-white/10"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={imageUrl}
              download={`ict-class-${subject.id}-certificate.png`}
              className="rounded-lg bg-[--color-brand] px-4 py-2 text-sm font-semibold text-black"
            >
              Download certificate
            </a>
            <WhatsAppShareButton
              text={`I just earned a Practice Mastery certificate in ${subject.name} on ICT Class! 🎓 ${publicEnv.appUrl}`}
              label="Share the news"
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm">
          <p className="text-white/70">
            Answer <strong>{eligibility.requiredQuestions}</strong> practice questions with at
            least <strong>{eligibility.requiredAccuracyPct}%</strong> accuracy to unlock your
            certificate for {subject.name}.
          </p>
          <div className="mt-4">
            <p className="flex justify-between text-xs text-white/45">
              <span>Questions answered</span>
              <span>
                {eligibility.questionsAnswered}/{eligibility.requiredQuestions}
              </span>
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[--color-brand]"
                style={{
                  width: `${Math.min(100, (eligibility.questionsAnswered / eligibility.requiredQuestions) * 100)}%`,
                }}
              />
            </div>
          </div>
          {eligibility.questionsAnswered > 0 ? (
            <p className="mt-4 text-white/55">
              Current accuracy: <strong className="text-white">{eligibility.accuracyPct}%</strong>
            </p>
          ) : null}
          <Link
            href={`/subjects/${subjectId}/practice`}
            className="mt-5 inline-block rounded-lg bg-[--color-brand] px-4 py-2 font-semibold text-black"
          >
            Go to Practice
          </Link>
        </div>
      )}
    </main>
  );
}
