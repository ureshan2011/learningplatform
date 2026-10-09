import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { isPaperId, pick } from "@/lib/exam-pack/config";
import { requireExamPackPage } from "@/lib/exam-pack/page-gate";
import { getPaper } from "@/lib/exam-pack/papers";
import { getMySittings, getSittingResult } from "@/lib/exam-pack/sittings";
import { PaperSitting } from "@/components/exam-pack/PaperSitting";
import { PredictedPaperDisclaimer } from "@/components/papers/PredictedPaperDisclaimer";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";

export const dynamic = "force-dynamic";

/**
 * One Exam Pack paper: the timed sitting, or — once submitted — the ranked
 * result and the walkthrough of every question.
 *
 * The page hands the sitting component no answers. If the paper is already
 * locked, the result (which does carry them) is read here on the server,
 * after the access check, and passed in whole.
 */
export default async function ExamPackPaperPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  if (!isPaperId(paperId)) notFound();

  const { user } = await requireExamPackPage(`/exam-pack/papers/${paperId}`);
  const [locale, result, sittings] = await Promise.all([
    getLocale(),
    getSittingResult(user.uid, paperId),
    getMySittings(user.uid),
  ]);
  const paper = getPaper(paperId);
  const inProgress = Boolean(sittings[paperId] && !sittings[paperId]?.submittedAt);

  return (
    <PageShell width="reading">
      <Link
        href="/exam-pack"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ict-fg-soft transition-colors duration-[120ms] hover:text-ict-accent-fg"
      >
        <Icon name="arrow_back" className="!text-base" />
        Exam Pack
      </Link>

      <div className="mt-4">
        <PageHeader title={pick(paper.title, locale)} subtitle={pick(paper.blurb, locale)} />
      </div>

      <div className="mt-5">
        <PaperSitting
          paperId={paperId}
          title={paper.title}
          durationMinutes={paper.durationMinutes}
          questionCount={paper.questions.length}
          kind={paper.kind}
          defaultLang={locale}
          inProgress={inProgress}
          initialResult={result}
          disclaimer={<PredictedPaperDisclaimer lang={locale} />}
        />
      </div>
    </PageShell>
  );
}
