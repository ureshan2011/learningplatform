import Link from "next/link";
import { notFound } from "next/navigation";
import { isStaff } from "@/lib/auth/session";
import { maskPhone } from "@/lib/phone";
import { formatDate } from "@/lib/format";
import { EXAM_PACK, PRINT_DOCS, isPaperId, isPrintDocKey, pick, type PaperId } from "@/lib/exam-pack/config";
import { requireExamPackPage } from "@/lib/exam-pack/page-gate";
import { getPaper, type PaperQuestion } from "@/lib/exam-pack/papers";
import { getMySittings } from "@/lib/exam-pack/sittings";
import { AL_ICT_2027_PREDICTED_PAPER2 } from "@/lib/content/al-ict-2027-predicted-paper2";
import { PREDICTED_PAPER_FRAMING_EN, PREDICTED_PAPER_FRAMING_SI } from "@/lib/content/al-ict-2027-focus-areas";
import { PrintPageButton } from "@/components/content/PrintPageButton";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";

export const dynamic = "force-dynamic";

type Lang = "en" | "si";

/**
 * A personalised, print-ready copy of an Exam Pack paper.
 *
 * "Download as PDF" is the phone's own print dialog → Save as PDF. That is a
 * deliberate choice, not a shortcut: a server-made PDF cannot shape Sinhala
 * without shipping a font-shaping engine, and the browser already does it
 * perfectly. `.ict-print` turns the dark page black-on-white for paper.
 *
 * Every page carries the buyer's name and masked number. That does not stop a
 * copy being shared — nothing can — but it makes a shared copy traceable, which
 * is what actually discourages it.
 *
 * An answer copy opens only after that paper has been submitted online, so a
 * student cannot print the key and then sit the ranked paper with it.
 */
export default async function ExamPackPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ doc: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { doc } = await params;
  if (!isPrintDocKey(doc)) notFound();
  const { user } = await requireExamPackPage(`/exam-pack/print/${doc}`);
  const lang: Lang = (await searchParams).lang === "si" ? "si" : "en";

  const meta = PRINT_DOCS.find((d) => d.key === doc)!;
  const answers = doc.endsWith("-answers");
  const paperId = (answers ? doc.slice(0, -"-answers".length) : doc) as string;

  // eslint-disable-next-line react-hooks/purity -- server component, one render per request
  const today = formatDate(Date.now());
  const licence = `${user.name} · ${maskPhone(user.phone)}`;

  let locked = false;
  if (answers && isPaperId(paperId) && !isStaff(user.role)) {
    const sittings = await getMySittings(user.uid);
    locked = !sittings[paperId]?.submittedAt;
  }

  return (
    <PageShell width="reading" className="ict-print">
      <div className="ict-print-hide mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/exam-pack"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ict-fg-soft hover:text-ict-accent-fg"
        >
          <Icon name="arrow_back" className="!text-base" />
          Exam Pack
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/exam-pack/print/${doc}`} className={lang === "en" ? "font-bold text-ict-fg" : "text-ict-fg-soft underline"}>
            English
          </Link>
          <Link
            href={`/exam-pack/print/${doc}?lang=si`}
            className={lang === "si" ? "font-bold text-ict-fg" : "text-ict-fg-soft underline"}
          >
            සිංහල
          </Link>
          {locked ? null : <PrintPageButton />}
        </div>
      </div>

      {locked ? null : (
        <p className="ict-print-hide mb-5 text-sm text-ict-fg-soft">
          {lang === "si"
            ? "Save as PDF ඔබලා, printer එක විදිහට \"Save as PDF\" තෝරන්න. ඔයාගේ phone එකේ PDF එකක් save වෙනවා."
            : "Tap Save as PDF, then choose \"Save as PDF\" as the printer. The file saves to your phone."}
        </p>
      )}

      <header className="border-b border-ict-line pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ict-fg-soft">ICT Campus · {EXAM_PACK.name}</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-ict-fg">{pick(meta.title, lang)}</h1>
        <p className="mt-1 text-xs text-ict-fg-soft">
          {lang === "si" ? "බලපත්‍රය" : "Licensed to"} {licence} · {today}
        </p>
      </header>

      {locked ? (
        <div className="mt-6">
          <Notice tone="info">
            {lang === "si"
              ? "මුලින්ම app එකේ paper එක කරලා submit කරන්න. ඊට පස්සේ answers සහ walkthrough print කරන්න පුළුවන් — එතකොට ඔයාගේ rank එක සාධාරණයි."
              : "Sit this paper in the app first. The answers and walkthrough open the moment you submit, so your rank stays honest."}
          </Notice>
          <Link
            href={`/exam-pack/papers/${paperId}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ict-accent-fg"
          >
            {lang === "si" ? "Paper එකට යන්න" : "Go to the paper"}
            <Icon name="arrow_forward" className="!text-base" />
          </Link>
        </div>
      ) : doc === "predicted-2027-p2" ? (
        <PaperTwo lang={lang} />
      ) : isPaperId(paperId) ? (
        <McqPaper paperId={paperId} lang={lang} answers={answers} />
      ) : null}

      {/* Repeats at the foot of every printed page. */}
      <p className="pointer-events-none fixed inset-x-0 bottom-1 hidden text-center text-[9px] text-ict-fg-soft print:block">
        {EXAM_PACK.name} · {lang === "si" ? "බලපත්‍රය" : "Licensed to"} {licence} · ictcampus.lk ·{" "}
        {lang === "si" ? "බෙදාගන්න එපා" : "Not for sharing"}
      </p>
    </PageShell>
  );
}

function McqPaper({ paperId, lang, answers }: { paperId: PaperId; lang: Lang; answers: boolean }) {
  const paper = getPaper(paperId);
  return (
    <div className="mt-6">
      {paper.kind === "predicted" ? (
        <p className="mb-5 text-xs text-ict-fg-soft">{lang === "si" ? PREDICTED_PAPER_FRAMING_SI : PREDICTED_PAPER_FRAMING_EN}</p>
      ) : null}

      {answers ? (
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold text-ict-fg">Answer key</h2>
          <ol className="mt-3 grid grid-cols-5 gap-x-4 gap-y-1.5 text-sm text-ict-fg sm:grid-cols-10">
            {paper.questions.map((q, i) => (
              <li key={q.id} className="tabular-nums">
                {i + 1}. <strong>({q.correctIndex + 1})</strong>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="mb-5 text-sm text-ict-fg">
          {lang === "si"
            ? `කාලය: විනාඩි ${paper.durationMinutes}. හැම ප්‍රශ්නයකටම වඩාත් ගැළපෙන පිළිතුර තෝරන්න.`
            : `Time: ${paper.durationMinutes} minutes. Choose the most suitable answer to every question.`}
        </p>
      )}

      <ol className="space-y-5">
        {paper.questions.map((q, i) => (
          <PrintQuestion key={q.id} index={i + 1} question={q} lang={lang} answers={answers} />
        ))}
      </ol>
    </div>
  );
}

function PrintQuestion({
  index,
  question,
  lang,
  answers,
}: {
  index: number;
  question: PaperQuestion;
  lang: Lang;
  answers: boolean;
}) {
  const text = question[lang];
  return (
    <li className="break-inside-avoid">
      <p className="text-sm font-semibold text-ict-fg">
        {index}. {text.stem}
      </p>
      {question.code ? (
        <pre className="mt-2 overflow-x-auto rounded-ict-md border border-ict-line p-2.5 font-mono text-xs whitespace-pre text-ict-fg">
          {question.code}
        </pre>
      ) : null}
      <ol className="mt-2 space-y-1 pl-4 text-sm text-ict-fg">
        {text.options.map((option, i) => (
          <li key={i} className={answers && i === question.correctIndex ? "font-bold" : undefined}>
            ({i + 1}) {option}
            {answers && i === question.correctIndex ? (lang === "si" ? " — පිළිතුර" : " — answer") : ""}
          </li>
        ))}
      </ol>
      {answers && question.walkthrough ? (
        <p className="mt-2 border-l-2 border-ict-line pl-3 text-sm leading-relaxed text-ict-fg-soft">
          {question.walkthrough}
        </p>
      ) : null}
    </li>
  );
}

function PaperTwo({ lang }: { lang: Lang }) {
  return (
    <div className="mt-6">
      <p className="mb-5 text-xs text-ict-fg-soft">{lang === "si" ? PREDICTED_PAPER_FRAMING_SI : PREDICTED_PAPER_FRAMING_EN}</p>
      <ol className="space-y-7">
        {AL_ICT_2027_PREDICTED_PAPER2.map((item) => {
          const scenario = lang === "si" ? (item.si.scenario ?? item.en.scenario) : item.en.scenario;
          return (
            <li key={item.id} className="break-inside-avoid">
              <p className="text-sm font-bold text-ict-fg">
                {item.id} · Part {item.part} · {item.topic} ({item.marks} {lang === "si" ? "ලකුණු" : "marks"})
              </p>
              {scenario ? <p className="mt-1.5 text-sm text-ict-fg">{scenario}</p> : null}
              <ol className="mt-2 space-y-1.5 text-sm text-ict-fg">
                {item.subparts.map((sp) => (
                  <li key={sp.label}>
                    ({sp.label}) {lang === "si" ? (sp.si ?? sp.en) : sp.en} [{sp.marks}]
                  </li>
                ))}
              </ol>
              <div className="mt-3 border-l-2 border-ict-line pl-3 text-sm text-ict-fg-soft">
                <p className="font-semibold text-ict-fg">Mark scheme</p>
                <p className="mt-1 leading-relaxed">{item.markScheme}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
