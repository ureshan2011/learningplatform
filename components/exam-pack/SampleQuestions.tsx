"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Badge, Button, Card } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";
import { CodeBlock, OptionBadge } from "@/components/exam-pack/parts";
import type { Bilingual } from "@/lib/exam-pack/config";
import type { ReviewQuestion } from "@/lib/exam-pack/paper-types";

type Lang = "en" | "si";

/**
 * The free sample: real questions from the pack, each with its answer and
 * walkthrough behind a tap. Only the preview set is ever passed in — the
 * server picks it (`previewQuestions()`), so the rest of the key never reaches
 * a visitor who has not bought.
 *
 * Built from role tokens, so the same component sits on the cream sales page
 * and inside the dark app.
 */
export function SampleQuestions({
  items,
  defaultLang,
  labels,
}: {
  items: Array<{ paperTitle: Bilingual; question: ReviewQuestion }>;
  defaultLang: Lang;
  labels: { show: Bilingual; hide: Bilingual; walkthrough: Bilingual };
}) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="inline-flex items-center gap-1 rounded-full bg-ict-surface-raised p-1 text-xs font-semibold">
          {(["en", "si"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 transition-colors duration-[120ms]",
                lang === l ? "bg-ict-orange-500 text-white" : "text-ict-fg-soft hover:text-ict-fg",
              )}
            >
              {l === "en" ? "English" : "සිංහල"}
            </button>
          ))}
        </div>
      </div>
      <ol className="space-y-3">
        {items.map(({ paperTitle, question }) => (
          <Sample
            key={`${paperTitle.en}-${question.id}`}
            paperTitle={paperTitle[lang]}
            question={question}
            lang={lang}
            labels={labels}
          />
        ))}
      </ol>
    </div>
  );
}

function Sample({
  paperTitle,
  question,
  lang,
  labels,
}: {
  paperTitle: string;
  question: ReviewQuestion;
  lang: Lang;
  labels: { show: Bilingual; hide: Bilingual; walkthrough: Bilingual };
}) {
  const [open, setOpen] = useState(false);
  const text = question[lang];
  return (
    <li>
      <Card radius="card" className="p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Badge tone="neutral">{paperTitle}</Badge>
          <Badge tone="neutral">{question.topic}</Badge>
        </div>
        <p className="font-semibold text-ict-fg">{text.stem}</p>
        {question.code ? <CodeBlock code={question.code} /> : null}
        <div className="mt-3.5 space-y-2">
          {text.options.map((option, i) => {
            const right = open && i === question.correctIndex;
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-start gap-2.5 rounded-ict-md border px-3.5 py-2.5 text-sm text-ict-fg",
                  right ? "border-ict-green-500/50 bg-ict-green-500/10" : "border-ict-line bg-ict-surface-raised",
                )}
              >
                <OptionBadge n={i + 1} tone={right ? "right" : "plain"} />
                <span className="min-w-0 flex-1">{option}</span>
              </div>
            );
          })}
        </div>
        <Button variant="outline" size="sm" arrow="none" onClick={() => setOpen((o) => !o)} className="mt-4">
          <span className="inline-flex items-center gap-1.5">
            <Icon name={open ? "unfold_less" : "unfold_more"} className="!text-sm" />
            {open ? labels.hide[lang] : labels.show[lang]}
          </span>
        </Button>
        {open && question.walkthrough ? (
          <div className="mt-3 rounded-ict-md border border-ict-line bg-ict-surface-sunken p-3.5 text-sm text-ict-fg">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-ict-accent-fg">
              {labels.walkthrough[lang]}
            </p>
            <p className="leading-relaxed">{question.walkthrough}</p>
          </div>
        ) : null}
      </Card>
    </li>
  );
}
