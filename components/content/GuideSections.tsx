import { Card } from "@/components/ds";
import type { PackGuideSection } from "@/lib/content/survival-pack";

/**
 * Sections of a Survival Pack guide, rendered for a free `/campus/*` page.
 *
 * The same content the pack shows inside the app, so a free sample and the
 * paid guide cannot drift apart. Templates are selectable plain text rather
 * than behind a copy button — these pages are static and cached, and a client
 * component would cost a hydration for one convenience.
 */
export function GuideSections({ sections }: { sections: PackGuideSection[] }) {
  return (
    <div className="mt-8 space-y-4">
      {sections.map((section) => (
        <Card key={section.heading.en} radius="card" className="p-6">
          <h2 className="font-display text-lg font-extrabold text-ict-fg">{section.heading.en}</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-ict-fg-soft">{section.body.en}</p>
          {section.templates?.map((t) => (
            <div key={t.label.en} className="mt-4">
              <p className="text-xs font-semibold text-ict-fg-mute">{t.label.en}</p>
              <pre className="mt-1.5 overflow-x-auto rounded-ict-md border border-ict-line bg-ict-surface p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-ict-fg">
                {t.text}
              </pre>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
