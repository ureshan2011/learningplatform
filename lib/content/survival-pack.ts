import type { Locale } from "@/lib/i18n/dictionary";
import type { IconName } from "@/components/ui/Icon";

/**
 * The Campus Survival Pack, described once.
 *
 * The pack page, the public sales page, the dashboard card and the teacher's
 * upload slots all read this file, so what is in the pack is decided in one
 * place rather than drifting between a marketing list and a download list.
 *
 * Deliberately not `server-only`: the teacher's upload form is a client
 * component and needs the slot keys. Nothing here is privileged — it is a
 * product description, and the files themselves are still gated by
 * `hasAccess()` and served through a signed URL.
 *
 * ## The Sinhala
 *
 * Everyday spoken Sinhala, with the technical words left in English the way a
 * first-year actually says them: Word, Excel, Python, Zotero, APA, Harvard,
 * assignment, reference, download, copy, AI. A coined Sinhala equivalent
 * nobody uses is harder to read than the English it replaced.
 */

/** A string that exists in both mediums. Resolved on the server, one language sent down. */
export interface PackText {
  en: string;
  si: string;
}

export function pick(text: PackText, locale: Locale): string {
  return locale === "si" ? text.si : text.en;
}

/** What the student gets: a file to download, or a guide to read in the app. */
export interface PackItem {
  /** The slot key. A `pack` ContentItem's `slug` matches this to its file. */
  key: string;
  kind: "download" | "guide";
  icon: IconName;
  title: PackText;
  blurb: PackText;
  /** Shown as a badge on a download so a student knows what will open it. */
  fileLabel?: "Word" | "Excel" | "Notebook" | "PDF" | "Zotero";
}

export const SURVIVAL_PACK = {
  /** One document, stable across years — never keyed by intake or by year. */
  id: "campus-survival-pack",
  name: "Campus Survival Pack",
  /** The console can change this; it is the fallback when no product exists yet. */
  feeLKR: 1990,
  /** Three years — the length of a degree. Not "lifetime": storage is not free forever. */
  accessDays: 1095,
  tagline: {
    en: "Everything your first assignment assumes you already know.",
    si: "පළවෙනි assignment එකට කලින්ම දැනගෙන ඉන්න ඕන කියලා හිතාගෙන ඉන්න හැම දෙයක්ම.",
  } satisfies PackText,
} as const;

/**
 * The eleven things in the pack, in the order they appear on the pack page.
 *
 * The Power BI template is deliberately absent. It cannot be authored without
 * Power BI Desktop, so it ships with the Power BI module later rather than
 * being listed as something a buyer does not receive.
 */
export const PACK_ITEMS: PackItem[] = [
  {
    key: "word-template",
    kind: "download",
    icon: "description",
    fileLabel: "Word",
    title: {
      en: "University assignment template",
      si: "University assignment Word template එක",
    },
    blurb: {
      en: "Cover page, heading styles, automatic contents, figure and table captions and page numbers, already set up. Type your work into it.",
      si: "Cover page, heading styles, automatic contents, figure සහ table captions, page numbers — ඔක්කොම කලින් set කරලා. ඔයාගේ assignment එක ඒකට type කරන්න විතරයි.",
    },
  },
  {
    key: "assignment-planner",
    kind: "download",
    icon: "calendar_month",
    fileLabel: "Excel",
    title: {
      en: "Assignment planner",
      si: "Assignment planner එක",
    },
    blurb: {
      en: "Put in the due date and it plans backwards: when to finish reading, drafting and proofreading, and how many words each section gets.",
      si: "Due date එක දැම්මම ඉතුරු ඔක්කොම ඉබේම හැදෙනවා — reading, draft, proofread කවදා ඉවර කරන්න ඕනද, section එකකට words කීයද කියලා.",
    },
  },
  {
    key: "data-workbook",
    kind: "download",
    icon: "grid_view",
    fileLabel: "Excel",
    title: {
      en: "Excel practice workbook",
      si: "Excel practice workbook එක",
    },
    blurb: {
      en: "A made-up district dataset to practise on: SUM, AVERAGE, IF, VLOOKUP and XLOOKUP, and a sheet ready for a pivot table.",
      si: "Practice කරන්න හදාගත්ත (synthetic) district data set එකක්. SUM, AVERAGE, IF, VLOOKUP, XLOOKUP සහ pivot table එකකට ලෑස්ති sheet එකක්.",
    },
  },
  {
    key: "python-starter",
    kind: "download",
    icon: "code",
    fileLabel: "Notebook",
    title: {
      en: "Python starter notebook",
      si: "Python starter notebook එක",
    },
    blurb: {
      en: "Opens in Google Colab, so a phone is enough. Loads the data, cleans it, groups it and draws a chart with pandas and matplotlib.",
      si: "Google Colab එකේ open වෙනවා, ඒ නිසා phone එකක් ඇති. Data load කරලා, clean කරලා, group කරලා chart එකක් හදන හැටි — pandas සහ matplotlib එක්ක.",
    },
  },
  {
    key: "zotero-library",
    kind: "download",
    icon: "auto_stories",
    fileLabel: "Zotero",
    title: {
      en: "Zotero starter library",
      si: "Zotero starter library එක",
    },
    blurb: {
      en: "Real Sri Lankan sources already entered. Import it into Zotero and cite them in one click.",
      si: "Sri Lankan sources ටිකක් කලින්ම දාපු library එකක්. Zotero එකට import කරලා එක click එකෙන් cite කරන්න පුළුවන්.",
    },
  },
  {
    key: "ai-declaration",
    kind: "download",
    icon: "fact_check",
    fileLabel: "Word",
    title: {
      en: "AI-use declaration template",
      si: "AI-use declaration template එක",
    },
    blurb: {
      en: "The form universities are starting to ask for: which tool, what you used it for, and what is your own work.",
      si: "AI පාවිච්චි කළා නම් මොකටද, කොහොමද කියලා ලියන form එක. Universities දැන් මේක ඉල්ලන්න පටන් අරන්.",
    },
  },
  {
    key: "survey-checklist",
    kind: "download",
    icon: "filter_list",
    fileLabel: "PDF",
    title: {
      en: "Survey design checklist",
      si: "Survey design checklist එක",
    },
    blurb: {
      en: "One page to check before you run a survey: sampling, question order, Likert scales, the consent line and a pilot.",
      si: "Survey එකක් කරන්න කලින් බලන්න ඕන දේවල් එක page එකක. Sampling, ප්‍රශ්න පිළිවෙළ, Likert scale, consent line එක සහ pilot එකක්.",
    },
  },
  {
    key: "apa-harvard",
    kind: "guide",
    icon: "rule",
    title: {
      en: "APA 7 and Harvard, quick reference",
      si: "APA 7 සහ Harvard — quick reference එක",
    },
    blurb: {
      en: "Book, journal article, website, government report, lecture slides and AI tool — in-text and reference list side by side, every example a Sri Lankan source.",
      si: "Book, journal article, website, government report, lecture slides, AI tool — in-text සහ reference list දෙකම එකට. හැම උදාහරණයක්ම Sri Lankan source එකක්.",
    },
  },
  {
    key: "first-week",
    kind: "guide",
    icon: "school",
    title: {
      en: "First week on campus",
      si: "Campus එකේ පළවෙනි සතිය",
    },
    blurb: {
      en: "Moodle, reading a brief, naming your files, submitting as PDF, asking for an extension, and group work.",
      si: "Moodle, assignment brief එකක් කියවන හැටි, file එකට නම දාන හැටි, PDF කරලා submit කරන හැටි, extension ඉල්ලන හැටි, group work.",
    },
  },
  {
    key: "academic-email",
    kind: "guide",
    icon: "mail",
    title: {
      en: "Academic email templates",
      si: "Academic email templates",
    },
    blurb: {
      en: "To a lecturer, an extension request, a missed class, a group-work problem, and asking for a reference. Copy and send.",
      si: "Lecturer කෙනෙකුට, extension ඉල්ලන්න, class එකක් missed උනාම, group work ප්‍රශ්නයකට, reference එකක් ඉල්ලන්න. Copy කරලා යවන්න.",
    },
  },
  {
    key: "ai-rules",
    kind: "guide",
    icon: "auto_awesome",
    title: {
      en: "Using AI honestly",
      si: "AI හරියට පාවිච්චි කරන හැටි",
    },
    blurb: {
      en: "Where help ends and misconduct starts, what you have to declare, and a generator that writes the declaration paragraph for you.",
      si: "කොහෙද help එක ඉවර වෙලා misconduct පටන් ගන්නේ, declare කරන්න ඕන මොනවද, සහ declaration paragraph එක හදලා දෙන tool එකක්.",
    },
  },
];

/** The seven upload slots, for the teacher's Pack-file picker. */
export const PACK_DOWNLOADS = PACK_ITEMS.filter((i) => i.kind === "download");

/** The four in-app guides. */
export const PACK_GUIDE_ITEMS = PACK_ITEMS.filter((i) => i.kind === "guide");

/**
 * Said on every guide and on the sales page.
 *
 * The pack is honest about how it was made and about what it is not. "Not
 * accredited" is a fact a buyer is entitled to before paying, not a disclaimer
 * buried after.
 */
export const AI_NOTE: PackText = {
  en: "Drafted with AI and reviewed by Dr. Yasas Sri Wickramasinghe. Not accredited by any university.",
  si: "AI එක්ක draft කරලා Dr. Yasas Sri Wickramasinghe review කරපු එකක්. කිසිම university එකකින් accredited නෑ.",
};
