"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge, Button, Card, SectionHeading } from "@/components/ds";
import {
  AL_ICT_2027_PREDICTED_PAPER2,
  PREDICTED_PAPER2_DURATION_MINUTES,
  PREDICTED_PAPER2_MARKS_SPLIT,
  PREDICTED_PAPER2_PART_A_COUNT,
  PREDICTED_PAPER2_PART_B_CHOOSE,
  PREDICTED_PAPER2_PART_B_COUNT,
} from "@/lib/content/al-ict-2027-predicted-paper2";
import type { PredictedStructuredItem } from "@/lib/types";

type Lang = "en" | "si";
const BAND_LABEL: Record<PredictedStructuredItem["confidenceBand"], { en: string; si: string }> = {
  high: { en: "High confidence", si: "ඉහළ විශ්වාසය" },
  medium: { en: "Medium confidence", si: "මධ්‍යම විශ්වාසය" },
  low: { en: "Low confidence", si: "අඩු විශ්වාසය" },
};
const BAND_TONE: Record<PredictedStructuredItem["confidenceBand"], "success" | "warning" | "neutral"> = {
  high: "success",
  medium: "warning",
  low: "neutral",
};

/**
 * Paper II has no single correct answer to score — same posture as every
 * real Paper II past-paper booklet: read the question, attempt it on paper,
 * then reveal the mark scheme. There is no auto-marking here because this
 * platform does not auto-mark free-text essay answers anywhere else either.
 */
export function PredictedPaperTwoViewer() {
  const [lang, setLang] = useState<Lang>("en");
  const partA = AL_ICT_2027_PREDICTED_PAPER2.filter((i) => i.part === "A");
  const partB = AL_ICT_2027_PREDICTED_PAPER2.filter((i) => i.part === "B");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionHeading as="h2" className="flex items-center gap-2.5 !text-xl">
          <Icon name="edit_note" className="text-ict-orange-400" />
          {lang === "si" ? "II ප්‍රශ්න පත්‍රය — ව්‍යුහගත හා රචනා" : "Paper II — Structured & Essay"}
        </SectionHeading>
        <div className="inline-flex items-center gap-1 rounded-full bg-ict-ink-850 p-1 text-xs font-semibold">
          <button
            onClick={() => setLang("en")}
            className={`rounded-full px-3.5 py-1.5 transition-colors duration-[120ms] ${lang === "en" ? "bg-ict-orange-500 text-white" : "text-ict-ink-300 hover:text-ict-paper-50"}`}
          >
            English
          </button>
          <button
            onClick={() => setLang("si")}
            className={`rounded-full px-3.5 py-1.5 transition-colors duration-[120ms] ${lang === "si" ? "bg-ict-orange-500 text-white" : "text-ict-ink-300 hover:text-ict-paper-50"}`}
          >
            සිංහල
          </button>
        </div>
      </div>

      <p className="text-sm text-ict-ink-300">
        {lang === "si"
          ? `මිනිත්තු ${PREDICTED_PAPER2_DURATION_MINUTES} — Part A (ප්‍රශ්න ${PREDICTED_PAPER2_PART_A_COUNT}ම පිළිතුරු දෙන්න) සහ Part B (ප්‍රශ්න ${PREDICTED_PAPER2_PART_B_COUNT}න් ${PREDICTED_PAPER2_PART_B_CHOOSE}ක් තෝරන්න). ලකුණු ${PREDICTED_PAPER2_MARKS_SPLIT.partA}/${PREDICTED_PAPER2_MARKS_SPLIT.partB} බැගින් (මූලාශ්‍රවල තහවුරු නොකළ පොදු අනුමානයකි).`
          : `${PREDICTED_PAPER2_DURATION_MINUTES} minutes — Part A (answer all ${PREDICTED_PAPER2_PART_A_COUNT}) and Part B (choose ${PREDICTED_PAPER2_PART_B_CHOOSE} of ${PREDICTED_PAPER2_PART_B_COUNT}). ${PREDICTED_PAPER2_MARKS_SPLIT.partA}/${PREDICTED_PAPER2_MARKS_SPLIT.partB} marks split — a reasonable, commonly-seen assumption, not a confirmed figure.`}
      </p>

      <PartSection title={lang === "si" ? "Part A — ව්‍යුහගත (සියල්ලටම පිළිතුරු දෙන්න)" : "Part A — Structured (answer all)"} items={partA} lang={lang} />
      <PartSection
        title={lang === "si" ? `Part B — රචනා (${PREDICTED_PAPER2_PART_B_COUNT}න් ${PREDICTED_PAPER2_PART_B_CHOOSE}ක් තෝරන්න)` : `Part B — Essay (choose ${PREDICTED_PAPER2_PART_B_CHOOSE} of ${PREDICTED_PAPER2_PART_B_COUNT})`}
        items={partB}
        lang={lang}
      />
    </div>
  );
}

function PartSection({ title, items, lang }: { title: string; items: PredictedStructuredItem[]; lang: Lang }) {
  return (
    <section className="mt-6">
      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-ict-ink-300">{title}</h3>
      <ol className="mt-2.5 space-y-2.5">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} lang={lang} />
        ))}
      </ol>
    </section>
  );
}

function ItemCard({ item, lang }: { item: PredictedStructuredItem; lang: Lang }) {
  const [revealed, setRevealed] = useState(false);
  const scenario = lang === "si" ? item.si.scenario ?? item.en.scenario : item.en.scenario;
  const band = BAND_LABEL[item.confidenceBand];

  return (
    <li>
      <Card radius="card" className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-ict-paper-50">
            {item.id} · {item.topic} <span className="text-ict-ink-300">({item.marks} marks)</span>
          </p>
          <Badge tone={BAND_TONE[item.confidenceBand]}>{band[lang]}</Badge>
        </div>

        {scenario ? <p className="mt-2 text-sm text-ict-paper-50">{scenario}</p> : null}

        <ol className="mt-3 space-y-2.5 text-sm text-ict-paper-50">
          {item.subparts.map((sp) => {
            const text = lang === "si" ? sp.si ?? sp.en : sp.en;
            return (
              <li key={sp.label}>
                <span className="font-medium">({sp.label})</span> {text}{" "}
                <span className="text-ict-ink-300">[{sp.marks}]</span>
              </li>
            );
          })}
        </ol>

        <Button
          variant="outline"
          size="sm"
          arrow="none"
          onClick={() => setRevealed((r) => !r)}
          className="mt-4"
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name={revealed ? "unfold_less" : "unfold_more"} className="!text-sm" />
            {revealed ? (lang === "si" ? "ලකුණු ක්‍රමය හංගන්න" : "Hide mark scheme") : lang === "si" ? "ලකුණු ක්‍රමය බලන්න" : "Show mark scheme"}
          </span>
        </Button>
        {revealed ? (
          <div className="mt-3 rounded-ict-md bg-ict-ink-900 p-3.5 text-xs text-ict-ink-300">
            <p>{item.markScheme}</p>
          </div>
        ) : null}

        <p className="mt-3.5 border-t border-ict-border-dark pt-3 text-xs text-ict-ink-300">{item.rationale}</p>
      </Card>
    </li>
  );
}
