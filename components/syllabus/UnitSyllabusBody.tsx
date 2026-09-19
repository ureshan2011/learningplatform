import { Icon } from "@/components/ui/Icon";
import { LessonAccordion } from "@/components/syllabus/LessonAccordion";
import { UNIT_TONE, unitIcon, isHighYield } from "@/lib/content/unit-visuals";
import { UNIT_SEO } from "@/lib/content/unit-seo";
import { indexClassesBySyllabus } from "@/lib/content/topic-classes";
import { buildLessonInteractives } from "@/lib/content/lesson-interactives";
import { getT, getLocale } from "@/lib/i18n/server";
import { Badge, Card } from "@/components/ds";
import type { ClassSession, Subject, Unit } from "@/lib/types";

/**
 * One syllabus unit: what it covers, and every lesson inside it.
 *
 * Extracted from `/syllabus/[subjectId]/[unitId]` so a signed-in student can
 * open the same lesson breakdown inside the app shell rather than being thrown
 * out to the public page. It names no palette colour — the primitives and the
 * role tokens decide — so it is white cards on the public route and near-black
 * panels inside `.ict-app`.
 *
 * The chip row used to be four hand-rolled `<span>` pills, two of them
 * carrying a coloured tint from the old per-unit palette and one a solid fill
 * for "high-yield". They are `Badge`s now: same information, one shape, and
 * the semantic colour is a thin tint rather than a block of it.
 */
export async function UnitSyllabusBody({
  subject,
  unit,
  sessions,
}: {
  subject: Subject;
  unit: Unit;
  sessions: ClassSession[];
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  // Sinhala-medium students read these pages too. The interactives take their
  // wording already resolved here, so only one language reaches the browser.
  const interactives = buildLessonInteractives(locale === "si" ? "si" : "en");

  // Matching against this unit alone keeps a class titled after another unit
  // from being pulled in here by a loose text match.
  const classIndex = indexClassesBySyllabus([unit], sessions);
  const unitClasses = classIndex.byUnit[unit.id] ?? [];
  const seo = UNIT_SEO[unit.competencyNumber];

  return (
    <>
      <Card radius="panel" className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Grade {unit.gradeYear}</Badge>
          <Badge tone="neutral">{unit.periods} periods</Badge>
          {seo?.qualifier ? <Badge tone="neutral">{seo.qualifier}</Badge> : null}
          {isHighYield(unit.periods) ? <Badge tone="brand">High-yield unit</Badge> : null}
        </div>

        <h1 className="mt-3 flex items-center gap-3 font-display text-2xl font-extrabold tracking-[-0.02em] text-ict-fg">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-ict-md text-white"
            style={{ background: UNIT_TONE.accent }}
          >
            <Icon name={unitIcon(unit.competencyNumber)} className="!text-2xl" />
          </span>
          {unit.title}
        </h1>
        <p className="mt-2 text-sm text-ict-fg-mute">{unit.competencyStatement}</p>
      </Card>

      <div className="mt-8">
        <LessonAccordion
          lessons={unit.lessons}
          tone={UNIT_TONE}
          subjectId={subject.id}
          classesByLesson={classIndex.byLesson}
          unitClasses={unitClasses}
          interactives={interactives}
          notesLabel={t("syllabus.notes")}
          noNotesLabel={t("syllabus.noNotes")}
          expandAll={t("syllabus.expandAll")}
          collapseAll={t("syllabus.collapseAll")}
          jumpLabel={t("syllabus.jumpToLesson")}
          objectivesLabel={t("syllabus.examObjectives")}
          importantLabel={t("syllabus.importantAreas")}
          lessonMeta={t("syllabus.lessonMeta")}
          sinhala={locale === "si"}
        />
      </div>
    </>
  );
}
