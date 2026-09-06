import { Icon } from "@/components/ui/Icon";
import { PREDICTED_PAPER_FRAMING_EN, PREDICTED_PAPER_FRAMING_SI } from "@/lib/content/al-ict-2027-focus-areas";

/**
 * The mandatory framing statement (Hard Rule 5 of the exam-pattern-analyst
 * prompt) — never dropped, never shortened away. Plain presentational
 * component so the wording is identical everywhere it appears: the public
 * promo page's teaser, the gated full paper, and the teacher's review page.
 */
export function PredictedPaperDisclaimer({ lang }: { lang: "en" | "si" }) {
  return (
    <div className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-4 text-xs text-(--color-awaken-ink-soft)">
      <p className="flex items-start gap-1.5 font-semibold text-(--color-awaken-ink)">
        <Icon name="info" className="!text-base shrink-0 text-(--color-awaken-accent)" />
        {lang === "si" ? "වගකීම් බැහැරවීම" : "Disclaimer"}
      </p>
      <p className="mt-1.5">{lang === "si" ? PREDICTED_PAPER_FRAMING_SI : PREDICTED_PAPER_FRAMING_EN}</p>
      <p className="mt-1.5">
        {lang === "si"
          ? "සිංහල පෙළ තවම ගුරුවරයෙකු විසින් සමාලෝචනය කර නොමැත — වචන හෝ අර්ථය පිළිබඳ සැකයක් ඇත්නම් English පෙළ බලන්න."
          : "The Sinhala wording is AI-drafted and has not yet had a native-speaking subject teacher's check — if anything reads oddly, the English is the more reliable version for now."}
      </p>
    </div>
  );
}
