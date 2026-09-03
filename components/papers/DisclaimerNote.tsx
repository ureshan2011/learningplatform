import { Icon } from "@/components/ui/Icon";
import { PAPER_QUESTION_COUNT } from "@/lib/content/al-ict-2026-paper1";

/**
 * Plain presentational component (no "use client") so it renders identically
 * whether it's reached from the server page's static answer key or the
 * client-side interactive quiz — same wording, same place, every time.
 */
export function DisclaimerNote({ lang, replacedCount }: { lang: "en" | "si"; replacedCount: number }) {
  return (
    <div className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-bg) p-4 text-xs text-(--color-awaken-ink-soft)">
      <p className="flex items-start gap-1.5 font-semibold text-(--color-awaken-ink)">
        <Icon name="info" className="!text-base shrink-0 text-(--color-awaken-accent)" />
        {lang === "si" ? "වගකීම් බැහැරවීම" : "Disclaimer"}
      </p>
      <p className="mt-1.5">
        {lang === "si"
          ? `මෙම පුහුණු ප්‍රශ්න පත්‍රය මුල් ප්‍රශ්න පත්‍රයේ ස්කෑන් කළ පිටපත් ඇසුරින් සකස් කරන ලදී. ස්කෑන් පිටපතේ සම්පූර්ණයෙන් පැහැදිලි නොවූ (හෝ අහම්බෙන් අඩංගු නොවූ) ප්‍රශ්න ${replacedCount}ක් පමණක්, සමාන දුෂ්කරතාවයකින් යුත් සම්බන්ධිත මාතෘකා පිළිබඳ මුල් ප්‍රශ්නවලින් ප්‍රතිස්ථාපනය කර ඇති අතර, ඒවා පිටුව පුරා පැහැදිලිව සලකුණු කර ඇත. අනෙකුත් සියලුම පිළිතුරු කිසිදු පිළිතුරු පත්‍රයකින් ලබාගත් ඒවා නොව, ස්වාධීනව සත්‍යාපනය කරන ලද ඒවා වේ.`
          : `This practice paper was prepared from scanned images of the original question paper. A small number of questions (${replacedCount} of ${PAPER_QUESTION_COUNT}) were not fully legible in the scan, or were missing from it entirely, and have been replaced with original questions of equivalent difficulty on closely related topics — each one is marked clearly throughout the page. Every other answer has been independently verified, not copied from any answer sheet.`}
      </p>
    </div>
  );
}
