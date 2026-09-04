/**
 * One place for the facts every page's metadata and structured data repeat.
 *
 * These are duplicated across the title tag, the meta description, the JSON-LD
 * and `llms.txt`. Search engines and AI answer engines both penalise a site
 * that describes itself three different ways, so they are defined once here
 * and imported rather than retyped per page.
 */

/** How the teacher is named everywhere. A search engine needs one spelling to attach authority to. */
export const TEACHER_NAME = "Dr. Yasas Sri Wickramasinghe";

export const TEACHER_LINKEDIN = "https://www.linkedin.com/in/yasassri";

/**
 * The subject as students, parents and the Department of Examinations name it.
 * A Sri Lankan A/L student types some subset of these into Google — "al ict",
 * "a/l ict class", "උසස් පෙළ ICT", "තොරතුරු තාක්ෂණය" — and the pages need the
 * exact strings on them, not paraphrases, to match.
 */
export const SUBJECT_EN = "A/L ICT";
export const SUBJECT_EN_LONG = "Advanced Level Information & Communication Technology";
export const SUBJECT_SI = "උසස් පෙළ තොරතුරු හා සන්නිවේදන තාක්ෂණය";
export const SUBJECT_SI_SHORT = "උසස් පෙළ ICT";

export const GRADES = "Grades 12 & 13";
export const MEDIUM_EN = "Sinhala medium";
export const MEDIUM_SI = "සිංහල මාධ්‍යය";

/** The country whose syllabus and exam this teaches to. Every page says so; ambiguity here loses the local search. */
export const COUNTRY = "Sri Lanka";

/**
 * The syllabus authority. Naming it explicitly is what distinguishes this from
 * Cambridge/Edexcel ICT, which is a completely different set of search results.
 */
export const SYLLABUS_AUTHORITY = "National Institute of Education (NIE)";

/**
 * The teacher's credentials, in the order that establishes authority fastest.
 * Used for the `Person` structured data and the on-page author line — Google's
 * quality guidance for education pages leans hard on who is teaching, and an
 * AI assistant asked "who teaches A/L ICT online" needs something to cite.
 */
export const TEACHER_CREDENTIALS = [
  "PhD in Human Interface Technology, University of Canterbury, New Zealand",
  "Senior Lecturer, New Zealand",
  "Former Lecturer, University of Moratuwa",
  "Industry researcher and tech lead — Sony, 99X, Niantic",
  "70,000+ students taught on Udemy and open.uom.lk",
] as const;

/** The A/L ICT exam's own shape. Stable across years, and the thing students search for by name. */
export const EXAM_STRUCTURE = {
  paper1: {
    name: "Paper I (MCQ)",
    questions: 50,
    durationMinutes: 120,
    note: "50 multiple-choice questions, answer all. Negative marking is not applied, so never leave a blank.",
  },
  paper2: {
    name: "Paper II (Structured & Essay)",
    durationMinutes: 180,
    note: "Part A structured questions (answer all), Part B essay questions (choose a subset). This is where command words decide the mark.",
  },
} as const;
