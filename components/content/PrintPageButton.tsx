"use client";

import { Icon } from "@/components/ui/Icon";

/**
 * "Short notes pdf" is what students actually search for, but there is no
 * file to host — the notes are generated from the same syllabus data as the
 * interactive breakdown, and keeping one source of truth matters more than
 * having a downloadable copy drift out of sync with it. The browser's own
 * print-to-PDF does the same job honestly: it saves exactly what is on the
 * page, right now, as a PDF. `print:hidden` on the chrome around it (nav,
 * this button, the CTAs) keeps the saved file to the notes alone.
 */
export function PrintPageButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ict-press inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-ict-ink-900 px-5 text-sm font-semibold text-ict-ink-900 transition-colors duration-[120ms] ease-ict hover:border-ict-orange-500 hover:text-ict-orange-600"
    >
      <Icon name="print" className="!text-base" />
      Save as PDF
    </button>
  );
}
