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

/** A block a student copies whole — an email, or a worked reference. */
export interface PackTemplate {
  label: PackText;
  /**
   * Left in English in both mediums on purpose: a Sri Lankan student emails a
   * lecturer in English, and a citation is printed in English whatever the
   * medium of the degree.
   */
  text: string;
}

export interface PackGuideSection {
  heading: PackText;
  body: PackText;
  templates?: PackTemplate[];
}

export interface PackGuide {
  key: string;
  title: PackText;
  sections: PackGuideSection[];
}

/**
 * The four in-app guides, in full.
 *
 * ## On the referencing examples
 *
 * Every worked reference below is a real source, checked by opening it while
 * this file was written: a fabricated citation in a referencing guide is the
 * one error that does direct damage — a student copies it, a marker looks it
 * up, and it does not exist. Where a citation depends on the student's own
 * material (their lecturer's slides, the AI tool they used), the example is a
 * form with blanks rather than an invented source, which is also closer to
 * what they actually have to fill in.
 */
export const PACK_GUIDES: PackGuide[] = [
  {
    key: "apa-harvard",
    title: {
      en: "APA 7 and Harvard, quick reference",
      si: "APA 7 සහ Harvard — quick reference එක",
    },
    sections: [
      {
        heading: {
          en: "Two places, every time",
          si: "හැම වතාවෙම තැන් දෙකක්",
        },
        body: {
          en: "A reference lives in two places at once. In-text, inside the sentence where you used the idea, short: author and year. In the reference list at the end, in full, so the marker can find the source themselves. If a source is in one place and not the other, it is a mistake — an in-text citation with no entry in the list, or an entry in the list you never cited, both lose marks. Sort the reference list alphabetically by the first author's surname. Do not number it.",
          si: "එක reference එකක් තැන් දෙකක තියෙන්න ඕන. එකක් in-text — ඔයා ඒ අදහස පාවිච්චි කරපු වාක්‍යය ඇතුළේ, කොටින්: author සහ අවුරුද්ද. අනෙක අන්තිමේ reference list එකේ, සම්පූර්ණයෙන්, marker ට ඒ source එක හොයාගන්න පුළුවන් වෙන්න. එකක තියෙනවා අනෙකේ නෑ නම් ඒක වැරැද්දක් — in-text දාලා list එකේ නැති එකත්, list එකේ දාලා cite කරලා නැති එකත් දෙකටම marks යනවා. Reference list එක පළවෙනි author ගේ surname එකෙන් alphabetical order එකට දාන්න. Number කරන්න එපා.",
        },
      },
      {
        heading: { en: "A book", si: "Book එකක්" },
        body: {
          en: "Author surname, initials, year in brackets, then the title in italics, then the publisher. Nothing else.",
          si: "Author ගේ surname එක, initials, අවුරුද්ද brackets ඇතුළේ, ඊට පස්සේ title එක italics වලින්, ඊට පස්සේ publisher. වෙන මොකුත් ඕන නෑ.",
        },
        templates: [
          {
            label: { en: "Reference list", si: "Reference list එකට" },
            text: "Kelegama, J. B. (2009). Sri Lanka economy in transition. Vijitha Yapa Publications.",
          },
          {
            label: { en: "In-text", si: "In-text" },
            text: "(Kelegama, 2009)",
          },
        ],
      },
      {
        heading: { en: "A journal article", si: "Journal article එකක්" },
        body: {
          en: "The article title is plain; the journal name and the volume number are italic. The issue number goes in brackets, then the page range, then the DOI as a full link. If it has a DOI, always give it — it is what lets the marker open the exact paper in one click. Two authors are joined with an ampersand; three or more are listed in full in the reference list but shortened to the first author plus et al. in text.",
          si: "Article එකේ title එක සාමාන්‍ය අකුරෙන්; journal එකේ නම සහ volume number එක italics. Issue number එක brackets ඇතුළේ, ඊට පස්සේ pages, ඊට පස්සේ DOI එක සම්පූර්ණ link එකක් විදියට. DOI එකක් තියෙනවා නම් හැම වෙලේම දාන්න — marker ට එක click එකෙන් හරියටම ඒ paper එක open කරගන්න පුළුවන් වෙන්නේ ඒකෙන්. Authors දෙන්නෙක් නම් ampersand එකෙන් join කරනවා; තුන් දෙනෙක් හෝ වැඩි නම් reference list එකේ ඔක්කොම ලියනවා, ඒත් in-text එකේ පළවෙනි author සහ et al. විතරයි.",
        },
        templates: [
          {
            label: { en: "Reference list", si: "Reference list එකට" },
            text: "Sriyalatha, M. A. K., Lalanie, P. P., & Withanawasam, M. P. K. (2025). Capturing a digital economy measurement framework for Sri Lanka. Sri Lanka Journal of Social Sciences, 48(2), 3–12. https://doi.org/10.4038/sljss.v48i02.9634",
          },
          {
            label: { en: "In-text", si: "In-text" },
            text: "(Sriyalatha et al., 2025)",
          },
          {
            label: { en: "Another, with four authors", si: "තව එකක් — authors හතර දෙනෙක්" },
            text: "Kulathunga, G. A. S., Wanniarachchi, P. C., Silva, S., & Abeysundara, P. D. A. (2025). Household food waste and its relationship with consumer demographics and behaviour: A case study from Kegalle District, Sri Lanka. Sri Lanka Journal of Social Sciences, 48(2), 29–41. https://doi.org/10.4038/sljss.v48i02.8760",
          },
        ],
      },
      {
        heading: { en: "A website", si: "Website එකක්" },
        body: {
          en: "Name the organisation as the author when no person is named. If the page carries no date, write n.d. Give the date you read it only when the page is the kind that changes — a live statistics page, a news feed.",
          si: "කිසි කෙනෙකුගේ නමක් නැත්නම් organisation එකම author විදියට දාන්න. Page එකේ date එකක් නෑ නම් n.d. කියලා ලියන්න. ඔයා කියවපු date එක දාන්න ඕන page එක වෙනස් වෙන ජාතියේ එකක් නම් විතරයි — live statistics page එකක්, news feed එකක් වගේ.",
        },
        templates: [
          {
            label: { en: "Reference list", si: "Reference list එකට" },
            text: "Sri Lankan Journals Online. (n.d.). Sri Lankan Journals Online. National Science Foundation of Sri Lanka. https://sljol.info/",
          },
          {
            label: { en: "In-text", si: "In-text" },
            text: "(Sri Lankan Journals Online, n.d.)",
          },
        ],
      },
      {
        heading: {
          en: "A government or institution report",
          si: "Government report එකක්",
        },
        body: {
          en: "The organisation is both the author and the publisher. Write the name out in full the first time you cite it in text, with the abbreviation in square brackets, and use the abbreviation after that. Watch the title: the Central Bank's Annual Report was discontinued after 2022 and replaced by the Annual Economic Review, so an older reference copied from a senior's assignment will name a report that no longer exists.",
          si: "Organisation එකම author සහ publisher දෙකම. In-text එකේ පළවෙනි පාරට නම සම්පූර්ණයෙන් ලියලා, abbreviation එක square brackets ඇතුළේ දාන්න; ඊට පස්සේ abbreviation එක විතරක් ඇති. Title එක ගැන ප්‍රවේසම් වෙන්න: Central Bank එකේ Annual Report එක 2022 න් පස්සේ නවත්තලා Annual Economic Review කියලා වෙනස් කරලා තියෙන්නේ, ඒ නිසා senior කෙනෙකුගේ assignment එකෙන් copy කරගත්ත පරණ reference එකක් දැන් නැති report එකක නම කියයි.",
        },
        templates: [
          {
            label: { en: "Reference list", si: "Reference list එකට" },
            text: "Central Bank of Sri Lanka. (2026). Annual economic review 2025. Central Bank of Sri Lanka. https://www.cbsl.gov.lk/",
          },
          {
            label: { en: "In-text, first time", si: "In-text, පළවෙනි පාර" },
            text: "(Central Bank of Sri Lanka [CBSL], 2026)",
          },
          {
            label: { en: "In-text, after that", si: "In-text, ඊට පස්සේ" },
            text: "(CBSL, 2026)",
          },
        ],
      },
      {
        heading: {
          en: "Lecture slides and course material",
          si: "Lecture slides සහ course material",
        },
        body: {
          en: "This one you have to fill in yourself, because the source is your own module. Take the lecturer's name and the module code exactly as they appear on the slide deck, and say in square brackets what the thing actually is. Some departments do not accept lecture slides as a source at all — they want the reading the slide was built from. Check your module handbook before you rely on one.",
          si: "මේක ඔයාටම පුරවන්න වෙනවා, මොකද source එක ඔයාගේම module එක. Lecturer ගේ නම සහ module code එක slide deck එකේ තියෙන විදියටම අරන්, square brackets ඇතුළේ ඒක ඇත්තටම මොකක්ද කියලා ලියන්න. සමහර departments lecture slides source එකක් විදියට බාර ගන්නේ නෑ — ඒ අය ඉල්ලන්නේ ඒ slide එක හදපු reading එක. එකක් උඩ රඳා පවතින්න කලින් module handbook එක බලන්න.",
        },
        templates: [
          {
            label: { en: "Fill in your own", si: "ඔයාගේ එක පුරවන්න" },
            text: "Lecturer surname, Initials. (Year). Title of the slide deck [Lecture slides]. Module code, Department, University name. URL or the name of the system it was posted on.",
          },
        ],
      },
      {
        heading: { en: "An AI tool", si: "AI tool එකක්" },
        body: {
          en: "Universities do not agree on this yet, and the wording changes from department to department — so take the pattern below, then check your own module handbook and use its wording where it differs. The tool is treated like software: the company that made it is the author, the version matters, and what you say in square brackets is what kind of thing it is. Whatever your handbook says, a citation is not a substitute for the declaration — see the Using AI honestly guide.",
          si: "මේක ගැන universities තාම එකඟ නෑ, department එකෙන් department එකට වචන වෙනස් වෙනවා — ඒ නිසා පහළ pattern එක අරන්, ඊට පස්සේ ඔයාගේ module handbook එක බලලා ඒකේ විදියට වෙනස් කරන්න. Tool එක software එකක් වගේ සලකනවා: හදපු company එක author, version එක වැදගත්, square brackets ඇතුළේ ලියන්නේ ඒක මොන ජාතියේ දෙයක්ද කියලා. Handbook එකේ මොනවා කිව්වත්, citation එකක් declaration එකට ආදේශකයක් නෙවෙයි — Using AI honestly guide එක බලන්න.",
        },
        templates: [
          {
            label: { en: "Fill in your own", si: "ඔයාගේ එක පුරවන්න" },
            text: "Company name. (Year). Tool name (Version or the date you used it) [Large language model]. URL",
          },
        ],
      },
      {
        heading: {
          en: "Harvard, and why yours may look different",
          si: "Harvard, සහ ඔයාගේ එක වෙනස් වෙන්නේ ඇයි",
        },
        body: {
          en: "APA 7 is one fixed style with one manual behind it. Harvard is not — it is a family of author-date styles, and each university writes its own version of it, so the commas and the italics differ between Colombo, Peradeniya, Moratuwa, Kelaniya and Sri Jayewardenepura. The structure is the same as APA: author, year, title, where it came from. What changes is the punctuation. Find your department's referencing guide, use it, and be consistent — a marker will forgive a comma that follows their guide's older edition far sooner than a reference list in three different styles.",
          si: "APA 7 කියන්නේ manual එකක් තියෙන ස්ථිර style එකක්. Harvard එහෙම නෙවෙයි — ඒක author-date styles පවුලක්, හැම university එකක්ම තමන්ගේම version එකක් ලියනවා, ඒ නිසා commas සහ italics Colombo, Peradeniya, Moratuwa, Kelaniya, Sri Jayewardenepura අතරේ වෙනස්. Structure එක APA වගේම: author, අවුරුද්ද, title, කොහෙන්ද ආවේ කියලා. වෙනස් වෙන්නේ punctuation එක විතරයි. ඔයාගේ department එකේ referencing guide එක හොයාගෙන ඒක පාවිච්චි කරලා, එකම විදියට කරගෙන යන්න — style තුනකින් ලියපු reference list එකකට වඩා, guide එකේ පරණ edition එකේ comma එකක් marker කෙනෙක් ගොඩක් ඉක්මනට සමාව දෙනවා.",
        },
      },
    ],
  },
  {
    key: "first-week",
    title: { en: "First week on campus", si: "Campus එකේ පළවෙනි සතිය" },
    sections: [
      {
        heading: { en: "Moodle, or whatever yours is called", si: "Moodle, නැත්නම් ඔයාලගේ එකට කියන නම" },
        body: {
          en: "Almost every Sri Lankan university runs Moodle — the LMS where slides, announcements and the submission link live. Log in on the first day, not the day the first assignment is due, because two things go wrong and both take days to fix: your account is not enrolled in a module you are actually taking, and the email address it has for you is one you never check. Turn on email notifications for announcements. A deadline is often moved in an announcement and nowhere else.",
          si: "ලංකාවේ හැම university එකක්ම වගේ Moodle පාවිච්චි කරනවා — slides, announcements සහ submission link එක තියෙන LMS එක. පළවෙනි දවසේම log in වෙන්න, පළවෙනි assignment එක දෙන්න ඕන දවසේ නෙවෙයි. මොකද ප්‍රශ්න දෙකක් එනවා, දෙකම හදාගන්න දවස් ගානක් යනවා: ඔයා ඇත්තටම කරන module එකකට ඔයාගේ account එක enrol වෙලා නෑ, සහ ඒකේ තියෙන email address එක ඔයා කවදාවත් බලන්නේ නැති එකක්. Announcements වලට email notifications on කරන්න. Deadline එකක් වෙනස් කරන්නේ ගොඩක් වෙලාවට announcement එකකින් විතරයි.",
        },
      },
      {
        heading: { en: "Reading the brief properly", si: "Brief එක හරියට කියවන හැටි" },
        body: {
          en: "The assignment brief is a specification, not an introduction. Read it with a pen and pull out five things: the exact question, the word count and whether references count towards it, the due date and time, the referencing style, and the marking rubric. The rubric is the part students skip and it is the part that tells you where the marks are — if 30 per cent is for analysis and 10 for presentation, that is how your time should split. If any of the five is missing from the brief, ask in the first week. Asking is normal; guessing in week eleven is not.",
          si: "Assignment brief එක කියන්නේ specification එකක්, හැඳින්වීමක් නෙවෙයි. Pen එකක් අරගෙන කියවලා දේවල් පහක් අයින් කරගන්න: හරියටම අහලා තියෙන ප්‍රශ්නය, word count එක සහ references ඒකට ගණන් ගන්නවද කියලා, due date සහ time එක, referencing style එක, සහ marking rubric එක. Students මඟ අරින්නේ rubric එක, ඒත් marks තියෙන්නේ කොහෙද කියලා කියන්නේ ඒකෙන්. Analysis වලට 30%, presentation වලට 10% නම්, ඔයාගේ වෙලාවත් බෙදෙන්න ඕන ඒ විදියට. මේ පහෙන් එකක්වත් brief එකේ නෑ නම් පළවෙනි සතියේම අහන්න. අහන එක සාමාන්‍ය දෙයක්; එකොළොස්වෙනි සතියේ අනුමාන කරන එක නෙවෙයි.",
        },
      },
      {
        heading: { en: "Name your files like an adult", si: "File එකට නම දාන හැටි" },
        body: {
          en: "Your marker opens two hundred files in a week. Use your index number, the module code and what the thing is, with no spaces: 2026IS1234_IS2011_Assignment1.pdf. Never Final.docx, never Final_final_v2.docx, never New Microsoft Word Document.docx. Some submission systems rename files, some reject spaces, and a file that cannot be traced to you is a file that cannot be marked.",
          si: "ඔයාගේ marker සතියකට files දෙසීයක් open කරනවා. Index number එක, module code එක සහ ඒක මොකක්ද කියලා දාන්න, spaces නැතුව: 2026IS1234_IS2011_Assignment1.pdf. Final.docx එහෙම දාන්න එපා, Final_final_v2.docx එපා, New Microsoft Word Document.docx එපා. සමහර submission systems file එකේ නම වෙනස් කරනවා, සමහර ඒවා spaces බාර ගන්නේ නෑ, සහ ඔයාට trace කරගන්න බැරි file එකක් කියන්නේ mark කරන්න බැරි file එකක්.",
        },
      },
      {
        heading: { en: "Submit as PDF", si: "PDF එකක් විදියට submit කරන්න" },
        body: {
          en: "Unless the brief asks for a Word file, export to PDF before you upload. A .docx opens differently on your marker's machine — fonts substitute, the table of contents shifts, your carefully placed figure lands on its own page. A PDF looks the same everywhere. In Word: File, Save as, and pick PDF. Then open the PDF and look at it. That last step is the one that catches the broken heading and the figure that vanished, and it takes ten seconds.",
          si: "Brief එකේ Word file එකක් ඉල්ලලා නැත්නම්, upload කරන්න කලින් PDF එකකට export කරන්න. .docx එකක් marker ගේ machine එකේ open වෙන්නේ වෙනස් විදියට — fonts මාරු වෙනවා, table of contents එක අනිත් පැත්තට යනවා, ඔයා පරිස්සමෙන් දාපු figure එක තනි page එකකට යනවා. PDF එකක් හැම තැනම එකම විදියට පේනවා. Word එකේ: File, Save as, PDF තෝරන්න. ඊට පස්සේ ඒ PDF එක open කරලා බලන්න. කැඩිච්ච heading එකයි නැති වෙච්ච figure එකයි අහුවෙන්නේ ඒ අන්තිම step එකෙන්, ඒකට යන්නේ තත්පර දහයයි.",
        },
      },
      {
        heading: { en: "Asking for an extension", si: "Extension එකක් ඉල්ලන හැටි" },
        body: {
          en: "Ask before the deadline, not after. Before, it is a request and it is usually granted; after, it is an appeal and it usually is not. Say what happened in one sentence, name the new date you are asking for, and attach the medical or other document if you have one. Do not explain at length, do not apologise three times, and do not say you had trouble with your laptop — every department has heard that one and most have a written rule that it is not grounds. If you are genuinely unwell, get the certificate on the day, not the week after.",
          si: "Deadline එකට කලින් අහන්න, පස්සේ නෙවෙයි. කලින් නම් ඒක request එකක්, ගොඩක් වෙලාවට දෙනවා; පස්සේ නම් ඒක appeal එකක්, ගොඩක් වෙලාවට දෙන්නේ නෑ. උනේ මොකක්ද කියලා එක වාක්‍යයකින් කියන්න, ඔයා ඉල්ලන අලුත් date එක කියන්න, medical එකක් හරි වෙන document එකක් හරි තියෙනවා නම් attach කරන්න. දිගට විස්තර කරන්න එපා, තුන් පාරක් සමාව ඉල්ලන්න එපා, laptop එකේ ප්‍රශ්නයක් කියලා කියන්නත් එපා — ඒක හැම department එකක්ම අහලා තියෙනවා, ගොඩක් ඒවාට ඒක හේතුවක් නෙවෙයි කියලා ලියපු rule එකක් තියෙනවා. ඇත්තටම අසනීප නම්, certificate එක ඒ දවසේම ගන්න, ඊළඟ සතියේ නෙවෙයි.",
        },
      },
      {
        heading: { en: "Group work", si: "Group work" },
        body: {
          en: "Group marks are where first-year students lose marks they earned. Three things prevent most of it. Agree who does what in writing, in the group chat, in week one — a message with names against tasks is evidence later. Keep the document in one shared place, not five copies emailed around, or you will merge the wrong version the night before. And if someone stops replying, tell the lecturer while there is still time to do something about it, not on the submission day: most departments can reweight a group mark, but only if they knew.",
          si: "First-year students හම්බකරගත්ත marks නැති කරගන්නේ group work වලින්. දේවල් තුනකින් ඒකෙන් ගොඩක් වළක්වගන්න පුළුවන්. කවුද මොනවද කරන්නේ කියලා පළවෙනි සතියේම ලියලා එකඟ වෙන්න, group chat එකේ — task එකකට නමක් දාපු message එකක් පස්සේට සාක්ෂියක්. Document එක එක shared තැනක තියාගන්න, email කරලා copies පහක් නෙවෙයි, නැත්නම් ඉස්සරහා දවසේ රෑ වැරදි version එක merge වෙනවා. කවුරු හරි reply කරන එක නැවැත්තුවා නම්, ඒක ගැන මොනවා හරි කරන්න වෙලාව තියෙද්දී lecturer ට කියන්න, submission දවසේ නෙවෙයි: ගොඩක් departments වලට group mark එක reweight කරන්න පුළුවන්, ඒත් දැනගෙන හිටියා නම් විතරයි.",
        },
      },
    ],
  },
  {
    key: "academic-email",
    title: { en: "Academic email templates", si: "Academic email templates" },
    sections: [
      {
        heading: { en: "How an academic email is built", si: "Academic email එකක් හැදෙන හැටි" },
        body: {
          en: "Five parts, in order: a subject line that names the module code and what you want, the correct title, one sentence saying who you are with your index number, the ask itself, and a plain sign-off. Keep it under six lines. Use Dear Dr. or Dear Professor with the surname — check their staff page rather than guessing, because getting the title wrong is the one thing that is noticed immediately. Use Mr. or Ms. only if you know they hold no doctorate. Send it from your university address, not a personal one, or it may never arrive.",
          si: "කොටස් පහක්, පිළිවෙළට: module code එකයි ඔයාට ඕන දේයි කියවෙන subject line එකක්, හරි title එක, ඔයා කවුද කියලා index number එකත් එක්ක එක වාක්‍යයක්, ඔයාට ඕන දේ, සහ සරල sign-off එකක්. Lines හයකට වඩා දිග කරන්න එපා. Dear Dr. නැත්නම් Dear Professor කියලා surname එකත් එක්ක ලියන්න — අනුමාන කරනවා වෙනුවට ඒ අයගේ staff page එක බලන්න, මොකද title එක වැරදුනොත් ඒක එකපාරටම ඇහෙනවා. Mr. හරි Ms. හරි පාවිච්චි කරන්න doctorate එකක් නෑ කියලා දන්නවා නම් විතරයි. University address එකෙන් යවන්න, පෞද්ගලික එකකින් නෙවෙයි, නැත්නම් ඒක ගිහින්ම නැති වෙන්න පුළුවන්.",
        },
      },
      {
        heading: { en: "The five you will actually need", si: "ඔයාට ඇත්තටම ඕන වෙන පහ" },
        body: {
          en: "Copy one, change what is in square brackets, and read it once before sending. Every bracket has to be replaced — an email that still says [module code] says you did not read your own message.",
          si: "එකක් copy කරලා, square brackets ඇතුළේ තියෙන ඒවා වෙනස් කරලා, යවන්න කලින් එක පාරක් කියවන්න. හැම bracket එකක්ම වෙනස් කරන්න ඕන — තාමත් [module code] කියලා තියෙන email එකක් කියන්නේ ඔයා ඔයාගේම message එක කියවලා නෑ කියන එකයි.",
        },
        templates: [
          {
            label: { en: "Asking a lecturer a question", si: "Lecturer කෙනෙකුගෙන් ප්‍රශ්නයක් අහන්න" },
            text: `Subject: [IS2011] Question about the week 6 reading

Dear Dr. [Surname],

I am [Your name], index number [2026IS1234], in your [module code] class.

I have read the week 6 brief and the [chapter or paper name], and I am not clear on [the one specific thing]. I understood it to mean [what you think it means] — is that right?

Thank you for your time.

[Your name]
[Index number]`,
          },
          {
            label: { en: "Asking for an extension", si: "Extension එකක් ඉල්ලන්න" },
            text: `Subject: [IS2011] Extension request — Assignment 1, index [2026IS1234]

Dear Dr. [Surname],

I am [Your name], index number [2026IS1234], in your [module code] class.

Assignment 1 is due on [current due date]. [One sentence on what happened.] I am asking for an extension until [the new date you want].

[I have attached my medical certificate. / I can provide documentation if you need it.]

Thank you for considering this.

[Your name]
[Index number]`,
          },
          {
            label: { en: "After missing a class", si: "Class එකක් missed උනාට පස්සේ" },
            text: `Subject: [IS2011] Missed lecture on [date], index [2026IS1234]

Dear Dr. [Surname],

I am [Your name], index number [2026IS1234]. I could not attend the lecture on [date] because [one short reason].

I have gone through the slides on Moodle and the notes from a classmate. Could you tell me whether anything was announced in that class that is not on Moodle — particularly about [the assignment or the exam]?

Thank you.

[Your name]
[Index number]`,
          },
          {
            label: { en: "A problem in group work", si: "Group work එකේ ප්‍රශ්නයක්" },
            text: `Subject: [IS2011] Group [number] — contribution concern

Dear Dr. [Surname],

I am [Your name], index number [2026IS1234], in group [number] for the [module code] assignment.

We divided the work on [date] and agreed in writing who would do each part. [Name] has not responded to the group since [date], and [their section] is not started. The submission is due on [date].

The rest of the group is continuing with the remaining sections. I wanted to raise it now rather than on the due date. Please tell me how you would like us to proceed.

Thank you.

[Your name]
[Index number]`,
          },
          {
            label: { en: "Asking for a reference letter", si: "Reference letter එකක් ඉල්ලන්න" },
            text: `Subject: Request for a reference — [Your name], [index number]

Dear Dr. [Surname],

I am [Your name], index number [2026IS1234]. I took [module code] with you in [year] and received [your grade].

I am applying for [what you are applying for], and the deadline is [date]. Would you be willing to write a reference for me?

If you are, I can send you my CV, my transcript and a short note on what the application asks for, so it takes you as little time as possible.

I understand if you are not able to.

Thank you.

[Your name]
[Index number]`,
          },
        ],
      },
      {
        heading: { en: "Before you send it", si: "යවන්න කලින්" },
        body: {
          en: "Check the name and the title. Check every square bracket is gone. Check the attachment is actually attached. And if you are angry about a mark, write the email, then send it tomorrow — the reply to an angry email is on your record for the rest of the degree.",
          si: "නම සහ title එක බලන්න. හැම square bracket එකක්ම අයින් වෙලාද කියලා බලන්න. Attachment එක ඇත්තටම attach වෙලාද කියලා බලන්න. Mark එකක් ගැන තරහ නම්, email එක ලියලා හෙට යවන්න — තරහෙන් යවපු email එකකට එන reply එක degree එක ඉවර වෙනකම් ඔයාගේ record එකේ තියෙනවා.",
        },
      },
    ],
  },
  {
    key: "ai-rules",
    title: { en: "Using AI honestly", si: "AI හරියට පාවිච්චි කරන හැටි" },
    sections: [
      {
        heading: { en: "Where help ends", si: "Help එක ඉවර වෙන තැන" },
        body: {
          en: "There is a line, and it is not where most students think it is. On the safe side: asking AI to explain a concept you did not follow, to check your grammar, to suggest what to read next, to explain an error message, to test you on what you have just learnt. On the other side: submitting text it wrote as your own, having it write your code and handing that in, asking it to summarise a paper you never opened and citing that paper, and inventing data. The test is simple. If the marker is giving you marks for thinking, the thinking has to be yours. If they are giving you marks for the writing being clean, help with the writing is usually fine — usually, because some modules assess writing itself, and there it is not.",
          si: "රේඛාවක් තියෙනවා, ඒත් ඒක තියෙන්නේ ගොඩක් students හිතන තැන නෙවෙයි. හරි පැත්තේ: තේරුණේ නැති concept එකක් explain කරන්න කියලා අහන එක, grammar check කරගන්න එක, ඊළඟට මොනවා කියවන්නද කියලා අහන එක, error message එකක් තේරුම් කරගන්න එක, ඉගෙනගත්ත දේ ගැන ඔයාව test කරන්න කියන එක. අනිත් පැත්තේ: ඒක ලියපු text එක ඔයාගේ කියලා දෙන එක, code එක ඒකෙන් ලියවගෙන submit කරන එක, කවදාවත් open නොකරපු paper එකක් summarise කරගෙන ඒක cite කරන එක, සහ data හදන එක. Test එක සරලයි. Marker marks දෙන්නේ හිතන එකට නම්, හිතන එක ඔයාගේ වෙන්න ඕන. Marks දෙන්නේ ලිවීම පිරිසිදු වෙච්ච එකට නම්, ලිවීමට උදව් ගන්න එක ගොඩක් වෙලාවට කමක් නෑ — ගොඩක් වෙලාවට, මොකද සමහර modules වල assess කරන්නේ ලිවීමම, එතන එහෙම නෙවෙයි.",
        },
      },
      {
        heading: { en: "The two that get people caught", si: "මිනිස්සු අහුවෙන දෙක" },
        body: {
          en: "Invented references. Ask an AI for sources and it will sometimes produce a title, an author and a DOI that look perfect and do not exist. A marker checks one, finds nothing, and now every other reference in your list is suspect. Open every source yourself before you cite it — if you cannot open it, do not cite it. Invented numbers. The same applies to statistics: a figure with no source you can point to is a figure you made up, whoever typed it.",
          si: "හදපු references. AI එකකින් sources ඉල්ලුවම සමහර වෙලාවට title එකක්, author කෙනෙක් සහ DOI එකක් හදලා දෙනවා — බලන්න හරි නියමයි, ඒත් ඒවා නෑ. Marker එකක් check කරලා මොකුත් හම්බවෙන්නේ නෑ, දැන් ඔයාගේ list එකේ අනිත් හැම reference එකක්ම සැකයි. Cite කරන්න කලින් හැම source එකක්ම ඔයාම open කරලා බලන්න — open කරගන්න බැරි නම් cite කරන්න එපා. හදපු numbers. Statistics වලටත් ඒකමයි: source එකක් පෙන්නන්න බැරි number එකක් කියන්නේ ඔයා හදපු number එකක්, ඒක type කළේ කවුරු වුණත්.",
        },
      },
      {
        heading: { en: "Declaring it", si: "Declare කරන එක" },
        body: {
          en: "More Sri Lankan departments are asking for a short declaration with every submission, and the number asking will only grow. Declaring costs you nothing — used within the rules, AI is not misconduct and saying so is not a confession. Not declaring, when they later ask, is. Write the declaration when you finish the work, while you still remember what you actually used it for. The generator below writes the paragraph; the Word template in this pack has the full form for departments that want it as a signed page.",
          si: "දැන් ලංකාවේ ගොඩක් departments හැම submission එකක් එක්කම කෙටි declaration එකක් ඉල්ලනවා, ඒ ගාන වැඩි වෙනවා මිසක් අඩු වෙන්නේ නෑ. Declare කරන එකෙන් ඔයාට නැති වෙන මොකුත් නෑ — rules ඇතුළේ පාවිච්චි කරනවා නම් AI කියන්නේ misconduct නෙවෙයි, ඒක කියන එක පාපොච්චාරණයකුත් නෙවෙයි. පස්සේ ඉල්ලුවම declare කරලා නැති එක තමයි ප්‍රශ්නේ. වැඩේ ඉවර වුණු ගමන් declaration එක ලියන්න, ඇත්තටම මොකටද පාවිච්චි කළේ කියලා තාම මතක තියෙද්දී. පහළ generator එකෙන් paragraph එක ලියලා දෙනවා; signed page එකක් විදියට ඕන departments වලට මේ pack එකේ Word template එකේ සම්පූර්ණ form එක තියෙනවා.",
        },
      },
      {
        heading: { en: "If your handbook says no", si: "Handbook එකේ බෑ කියලා තියෙනවා නම්" },
        body: {
          en: "Some modules ban AI entirely, and that ban is the rule for that module whatever this guide says. Read the handbook. Where it is silent, ask the lecturer in writing and keep the reply — a message in your inbox is worth more than a memory of what someone said in a corridor.",
          si: "සමහර modules වල AI සම්පූර්ණයෙන්ම තහනම්, මේ guide එකේ මොනවා තිබුණත් ඒ module එකට rule එක ඒකයි. Handbook එක කියවන්න. ඒකේ ඒ ගැන කිසි දෙයක් නෑ නම්, lecturer ගෙන් ලිඛිතව අහලා reply එක තියාගන්න — කොරිඩෝවේ කවුරු හරි කිව්ව දෙයක මතකයට වඩා inbox එකේ තියෙන message එකක් වටිනවා.",
        },
      },
    ],
  },
];

/** The two templates published free at `/campus/academic-email` as the search sample. */
export const FREE_EMAIL_SAMPLE_COUNT = 2;

/**
 * The files that ship with the application, under
 * `content-packs/campus-survival-pack/`.
 *
 * The pack has to work on a platform nobody can upload to: the owner can paste
 * Firebase rules and nothing else, so a pack whose contents arrive by hand is a
 * pack that stays empty. These are served by `/api/packs/[subjectId]/files/`,
 * which checks `hasAccess()` on every request — so there is still no stable URL
 * and no public path, which was the property the signed-URL design existed to
 * protect.
 *
 * A file uploaded into a slot from the console wins over the bundled one, so
 * replacing any of these later needs no deploy.
 */
export interface PackBundledFile {
  /** The slot it fills. Absent means it appears under "More files". */
  slot?: string;
  /** Filename on disk, and what the browser saves it as. The download allowlist. */
  name: string;
}

export const PACK_BUNDLED_FILES: PackBundledFile[] = [
  { slot: "word-template", name: "university-assignment-template.docx" },
  { slot: "assignment-planner", name: "assignment-planner.xlsx" },
  { slot: "data-workbook", name: "excel-practice-workbook.xlsx" },
  { slot: "python-starter", name: "python-starter.ipynb" },
  { slot: "zotero-library", name: "zotero-starter-library.ris" },
  { slot: "ai-declaration", name: "ai-use-declaration.docx" },
  { slot: "survey-checklist", name: "survey-design-checklist.pdf" },
  // The notebook's dataset and the BibTeX copy of the library. No slot of their
  // own — they belong to the two above rather than standing alone.
  { name: "sri-lanka-districts-synthetic.csv" },
  { name: "zotero-starter-library.bib" },
];

export function bundledFileForSlot(slot: string): PackBundledFile | undefined {
  return PACK_BUNDLED_FILES.find((f) => f.slot === slot);
}

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
