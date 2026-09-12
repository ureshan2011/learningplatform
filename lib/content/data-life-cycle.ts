import type { IconName } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n/dictionary";

/**
 * The three stages of the data life cycle, with one record followed through
 * all of them.
 *
 * Competency level 1.1 asks a student to "list the stages of the data life
 * cycle: creation, management, removal of obsolete data". Three bullet points
 * is what the syllabus gives and three bullet points is what most students
 * memorise, which is why the third one gets dropped in the exam — nothing ties
 * it to the first two.
 *
 * So one running example moves through all three: a mock exam attempt on this
 * platform, created, managed, and eventually deleted. Same record, three
 * stages, which is the thing the list on its own fails to convey.
 *
 * The stage names themselves are examined vocabulary, so the Sinhala for them
 * is in `lib/i18n/ict-terms.ts` to be checked against the NIE resource book
 * rather than written here.
 */

export interface LifeCycleStage {
  key: string;
  label: string;
  icon: IconName;
  summary: string;
  example: string;
}

type L = Record<Locale, string>;

const STAGE_DATA: Array<{
  key: string;
  label: L;
  icon: IconName;
  summary: L;
  example: L;
}> = [
  {
    key: "create",
    label: { en: "Creation", si: "නිර්මාණය" },
    icon: "edit_note",
    summary: {
      en: "Data is generated the instant an event happens — typed in, sensed, scanned or submitted.",
      si: "සිදුවීමක් වෙන හරියටම මොහොතේ දත්ත හැදෙනවා — type කරලා, sensor එකකින්, scan කරලා, නැත්නම් submit කරලා.",
    },
    example: {
      en: 'A student taps "Submit" on a mock exam. That instant, a new record is created: their answers, the time taken, the raw score.',
      si: "ශිෂ්‍යයෙක් mock exam එකක Submit එබුවා. ඒ මොහොතේම අලුත් වාර්තාවක් හැදෙනවා: එයාගේ උත්තර, ගත වුණු කාලය, අමු ලකුණු.",
    },
  },
  {
    key: "manage",
    label: { en: "Management", si: "කළමනාකරණය" },
    icon: "storage",
    summary: {
      en: "Data is stored, backed up, organised, and processed into information people actually use.",
      si: "දත්ත ගබඩා කරනවා, backup කරනවා, පිළිවෙළට දානවා, ඊට පස්සේ මිනිස්සු ඇත්තටම පාවිච්චි කරන තොරතුරු බවට සකසනවා.",
    },
    example: {
      en: "That record is stored and backed up, then processed — averaged into a class ranking, compared against last month's attempt, shown on a leaderboard.",
      si: "ඒ වාර්තාව ගබඩා කරලා backup කරනවා, ඊට පස්සේ සකසනවා — පන්තියේ ranking එකට සාමාන්‍යය ගන්නවා, පහුගිය මාසේ උත්සාහය එක්ක සංසන්දනය කරනවා, leaderboard එකේ පෙන්නනවා.",
    },
  },
  {
    key: "remove",
    label: { en: "Removal of obsolete data", si: "යල් පැන ගිය දත්ත ඉවත් කිරීම" },
    icon: "cancel",
    summary: {
      en: "Data that is no longer accurate, needed, or legally required to keep is deleted or archived.",
      si: "තව නිවැරදි නැති, තව ඕන නැති, නීතියෙන් තියාගන්න ඕන නැති දත්ත මකනවා නැත්නම් archive කරනවා.",
    },
    example: {
      en: "Years later, a graduated student asks for their account to be deleted. Keeping the attempt forever would serve no one, and data-protection law says it shouldn't be kept.",
      si: "අවුරුදු කීපයකට පස්සේ, පාසල ඉවර කරපු ශිෂ්‍යයෙක් එයාගේ ගිණුම මකන්න කියනවා. ඒ උත්සාහය සදාකාලිකවම තියාගෙන කාටවත් වැඩක් නෑ, දත්ත ආරක්ෂණ නීතියෙනුත් කියන්නේ තියාගන්න එපා කියලයි.",
    },
  },
];

export function lifeCycleStages(locale: Locale = "en"): LifeCycleStage[] {
  return STAGE_DATA.map((s) => ({
    key: s.key,
    label: s.label[locale],
    icon: s.icon,
    summary: s.summary[locale],
    example: s.example[locale],
  }));
}
