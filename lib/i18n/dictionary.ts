/**
 * Interface copy, in English and Sinhala.
 *
 * ## How the Sinhala is written
 *
 * Everyday spoken Sinhala, not literary Sinhala. These are 16-year-olds, and a
 * formally "correct" translation nobody uses in conversation is harder to read
 * than the English it replaced.
 *
 * **Technical words stay in English**, in Latin script, exactly as students say
 * them out loud: subscribe, XP, Code Lab, SQL, Zoom, Live. A student searching
 * for "Mock exam" will not recognise a coined Sinhala equivalent, and the
 * exam-hall vocabulary they need to learn is English anyway. Where a word has a
 * settled Sinhala form in daily use it takes it — පන්තිය for class, ගුරු for
 * teacher, ගෙවීම් for payments.
 *
 * Words deliberately avoided because no student says them: ප්‍රවේශ පත්‍රය,
 * දත්ත සමුදාය, ගිණුම් ප්‍රවේශය.
 *
 * ## Scope
 *
 * This covers the signed-in student surface and the navigation — the screens a
 * student reads every day. The teacher console stays English: it has one
 * reader, who set the platform up in English, and translating an accounting
 * ledger badly is worse than not translating it.
 */

export const LOCALES = ["en", "si"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  si: "සිංහල",
};

const en = {
  /* ---- navigation ---- */
  "nav.dashboard": "Dashboard",
  "nav.practice": "Practice",
  "nav.mockExams": "Mock exams",
  "nav.codeLab": "Code Lab",
  "nav.notesPapers": "Notes & papers",
  "nav.syllabus": "Syllabus",
  "nav.certificate": "Certificate",
  "nav.freeNotes": "Free notes",
  "nav.pastPapers": "Past papers",
  "nav.commandWords": "Command words",
  "nav.account": "Account & billing",
  "nav.teacherConsole": "Teacher console",
  "nav.groupFree": "Free resources",
  "nav.groupYou": "You",
  "nav.groupStaff": "Staff",
  "nav.home": "Home",
  "nav.notes": "Notes",
  "nav.mocks": "Mocks",
  "nav.more": "More",
  "nav.menu": "Menu",
  "nav.signOut": "Sign out",
  "nav.yourAccount": "Your account",

  /* ---- shell status ---- */
  "status.subscribed": "Subscribed",
  "status.notSubscribed": "Not subscribed",
  "promo.title": "Unlock the full class",
  "promo.body": "Live classes, practice, mock exams and every paper.",
  "promo.cta": "See details",

  /* ---- dashboard ---- */
  "dash.greeting": "Hi {name},",
  "dash.liveNow": "Your class is\nlive right now",
  "dash.startClass": "Start your\nA/L ICT class",
  "dash.streakHead": "{days} day streak\nkeep it going",
  "dash.ready": "Ready when\nyou are",
  "dash.joinNow": "Join now",
  "dash.openClass": "Open class",
  "dash.practiseNow": "Practise now",
  "dash.seeIncluded": "See what's included",
  "dash.streakChip": "{days} days in a row",
  "dash.xpChip": "{xp} XP",
  "dash.classesAhead": "{count} classes ahead",
  "dash.continueStudying": "Continue studying",
  "dash.yourClasses": "Your classes",
  "dash.yourClassesHint": "Everything you are subscribed to",
  "dash.subscribeHint": "Subscribe to unlock live classes, practice and papers",
  "dash.freeForEveryone": "Free for everyone",
  "dash.freeHint": "No subscription needed",
  "dash.timetable": "Timetable",
  "dash.timetableNext": "Next {count}",
  "dash.noTimetableLocked": "Subscribe and your class timetable appears here.",
  "dash.noTimetable": "Nothing scheduled yet. Your teacher will add the next class soon.",
  "dash.inviteTitle": "Invite a friend",
  "dash.inviteBody": "When they subscribe you both get 3 free days.",
  "dash.inviteCta": "Get your code",
  "dash.paidUntil": "Paid until {date}",
  "dash.perMonth": "{price} per month",
  "dash.active": "Active",
  "dash.open": "Open",
  "dash.payByBank": "Pay by bank deposit",
  "dash.liveBadge": "Live now",

  /* ---- study tools ---- */
  "tool.practice": "Practice",
  "tool.practiceBlurb": "Questions that target your weak topics",
  "tool.mockExams": "Mock exams",
  "tool.mockExamsBlurb": "Timed papers, ranked results",
  "tool.codeLab": "Code Lab",
  "tool.codeLabBlurb": "Pseudocode, spreadsheets and SQL",
  "tool.notes": "Notes & papers",
  "tool.notesBlurb": "Everything to download",
  "res.freeNotes": "Free notes",
  "res.freeNotesBlurb": "Open notes and papers",
  "res.pastPapers": "Past papers",
  "res.pastPapersBlurb": "Every year, with schemes",
  "res.commandWords": "Command words",
  "res.commandWordsBlurb": "What each question wants",

  /* ---- subject ---- */
  "subject.overview": "Overview",
  "subject.locked": "Locked",
  "subject.activeUntil": "Active until {date}",
  "subject.fullAccess": "Full access",
  "subject.subscribeToUnlock": "Subscribe to unlock",
  "subject.renewToCarryOn": "Renew to carry on",
  "subject.subscriptionEnded": "Subscription ended",
  "subject.renewNow": "Renew now",
  "subject.notesPapers": "Notes & past papers",
  "subject.nothingPublished": "Nothing published yet",
  "subject.download": "Download",
  "subject.whatsIncluded": "What's included",
  "subject.monthly": "Monthly",
  "subject.cancelAnyTime": "Cancel any time.",
  "subject.yourAccess": "Your access",
  "subject.billing": "Billing & receipts",

  /* ---- account ---- */
  "account.title": "Your account",
  "account.subscriptions": "Subscriptions",
  "account.subscriptionsHint": "What you currently have access to",
  "account.noSubscriptions": "No subscriptions yet. Pick a class from your dashboard to get started.",
  "account.browseClasses": "Browse classes",
  "account.payments": "Payments & receipts",
  "account.totalPaid": "{amount} paid in total",
  "account.nothingPaid": "Nothing paid yet",
  "account.noPayments": "No payments yet.",
  "account.receipt": "Receipt",
  "account.waitingApproval": "Waiting for approval",
  "account.refunded": "Refunded",
  "account.parentView": "Parent view",
  "account.parentHint": "Let a parent follow your progress",
  "account.devices": "Devices",
  "account.devicesBody":
    "Your account works on up to {max} devices. If you run out, signing in on a new one lets you drop the oldest.",
  "account.noDevices": "None bound yet.",
  "account.lastUsed": "last used {date}",
  "account.details": "Details",
  "account.school": "School",
  "account.district": "District",
  "account.language": "Language",
  "account.languageHint": "Choose the language for buttons and menus.",

  /* ---- generic ---- */
  "common.loading": "Loading…",
  "common.back": "Back",
} as const;

export type MessageKey = keyof typeof en;

/**
 * Sinhala.
 *
 * `\n` in a headline is a deliberate line break, not a wrap — the design system
 * treats the break as a design decision, so the Sinhala breaks where the
 * Sinhala reads best, not where the English did.
 */
const si: Record<MessageKey, string> = {
  "nav.dashboard": "මුල් පිටුව",
  "nav.practice": "පුහුණුව",
  "nav.mockExams": "Mock exam",
  "nav.codeLab": "Code Lab",
  "nav.notesPapers": "නෝට්ස් සහ පේපර්",
  "nav.syllabus": "සිලබස්",
  "nav.certificate": "සර්ටිෆිකට්",
  "nav.freeNotes": "නොමිලේ නෝට්ස්",
  "nav.pastPapers": "පසුගිය පේපර්",
  "nav.commandWords": "Command words",
  "nav.account": "ගිණුම සහ ගෙවීම්",
  "nav.teacherConsole": "ගුරු පැනලය",
  "nav.groupFree": "නොමිලේ",
  "nav.groupYou": "ඔබ",
  "nav.groupStaff": "කාර්ය මණ්ඩලය",
  "nav.home": "මුල",
  "nav.notes": "නෝට්ස්",
  "nav.mocks": "Mock",
  "nav.more": "තව",
  "nav.menu": "මෙනුව",
  "nav.signOut": "පිටවන්න",
  "nav.yourAccount": "ඔබේ ගිණුම",

  "status.subscribed": "Subscribe කර ඇත",
  "status.notSubscribed": "Subscribe කර නැත",
  "promo.title": "සම්පූර්ණ පන්තිය ලබාගන්න",
  "promo.body": "Live පන්ති, පුහුණුව, mock exam සහ සියලු පේපර්.",
  "promo.cta": "විස්තර බලන්න",

  "dash.greeting": "ආයුබෝවන් {name},",
  "dash.liveNow": "ඔබේ පන්තිය\nදැන් live",
  "dash.startClass": "ඔබේ A/L ICT\nපන්තිය පටන් ගන්න",
  "dash.streakHead": "දිගටම දින {days}\nඑහෙමම තියාගන්න",
  "dash.ready": "ඔබ සූදානම් නම්\nපටන් ගමු",
  "dash.joinNow": "දැන් සම්බන්ධ වන්න",
  "dash.openClass": "පන්තිය බලන්න",
  "dash.practiseNow": "දැන් පුහුණු වන්න",
  "dash.seeIncluded": "මොනවද තියෙන්නේ බලන්න",
  "dash.streakChip": "දිගටම දින {days}",
  "dash.xpChip": "{xp} XP",
  "dash.classesAhead": "පන්ති {count} ක්",
  "dash.continueStudying": "දිගටම ඉගෙන ගන්න",
  "dash.yourClasses": "ඔබේ පන්ති",
  "dash.yourClassesHint": "ඔබ subscribe කර ඇති සියල්ල",
  "dash.subscribeHint": "Live පන්ති, පුහුණුව සහ පේපර් ලබාගන්න subscribe වන්න",
  "dash.freeForEveryone": "සැමට නොමිලේ",
  "dash.freeHint": "Subscribe වෙන්න ඕන නෑ",
  "dash.timetable": "පන්ති වේලාව",
  "dash.timetableNext": "ඊළඟ {count}",
  "dash.noTimetableLocked": "Subscribe කළාම ඔබේ පන්ති වේලාව මෙතන පෙන්නයි.",
  "dash.noTimetable": "තවම පන්තියක් දාලා නෑ. ගුරුතුමා ඉක්මනින් ඊළඟ පන්තිය දානවා.",
  "dash.inviteTitle": "යාළුවෙක්ට කියන්න",
  "dash.inviteBody": "එයා subscribe කළොත් දෙන්නටම නොමිලේ දින 3 ක්.",
  "dash.inviteCta": "ඔබේ code එක ගන්න",
  "dash.paidUntil": "{date} දක්වා ගෙවා ඇත",
  "dash.perMonth": "මසකට {price}",
  "dash.active": "සක්‍රීයයි",
  "dash.open": "විවෘත කරන්න",
  "dash.payByBank": "බැංකුවට ගෙවන්න",
  "dash.liveBadge": "දැන් live",

  "tool.practice": "පුහුණුව",
  "tool.practiceBlurb": "ඔබට අමාරු තැන් ඉලක්ක කරන ප්‍රශ්න",
  "tool.mockExams": "Mock exam",
  "tool.mockExamsBlurb": "වේලාව සීමිත පේපර්, rank සමඟ",
  "tool.codeLab": "Code Lab",
  "tool.codeLabBlurb": "Pseudocode, spreadsheet සහ SQL",
  "tool.notes": "නෝට්ස් සහ පේපර්",
  "tool.notesBlurb": "බාගන්න පුළුවන් සියල්ල",
  "res.freeNotes": "නොමිලේ නෝට්ස්",
  "res.freeNotesBlurb": "නෝට්ස් සහ පේපර්",
  "res.pastPapers": "පසුගිය පේපර්",
  "res.pastPapersBlurb": "හැම අවුරුද්දකම, scheme එක්ක",
  "res.commandWords": "Command words",
  "res.commandWordsBlurb": "එක එක ප්‍රශ්නෙන් අහන්නේ මොකක්ද",

  "subject.overview": "සාරාංශය",
  "subject.locked": "Lock වෙලා",
  "subject.activeUntil": "{date} දක්වා සක්‍රීයයි",
  "subject.fullAccess": "සම්පූර්ණ ප්‍රවේශය",
  "subject.subscribeToUnlock": "Unlock කරන්න subscribe වන්න",
  "subject.renewToCarryOn": "දිගටම කරන්න අලුත් කරන්න",
  "subject.subscriptionEnded": "Subscription එක ඉවරයි",
  "subject.renewNow": "දැන් අලුත් කරන්න",
  "subject.notesPapers": "නෝට්ස් සහ පසුගිය පේපර්",
  "subject.nothingPublished": "තවම දාලා නෑ",
  "subject.download": "බාගන්න",
  "subject.whatsIncluded": "මොනවද තියෙන්නේ",
  "subject.monthly": "මාසිකව",
  "subject.cancelAnyTime": "ඕන වෙලාවක නවත්තන්න පුළුවන්.",
  "subject.yourAccess": "ඔබේ ප්‍රවේශය",
  "subject.billing": "ගෙවීම් සහ රිසිට්පත්",

  "account.title": "ඔබේ ගිණුම",
  "account.subscriptions": "Subscriptions",
  "account.subscriptionsHint": "ඔබට දැන් ලැබෙන දේවල්",
  "account.noSubscriptions": "තවම subscription නෑ. මුල් පිටුවෙන් පන්තියක් තෝරන්න.",
  "account.browseClasses": "පන්ති බලන්න",
  "account.payments": "ගෙවීම් සහ රිසිට්පත්",
  "account.totalPaid": "මුළු ගෙවීම {amount}",
  "account.nothingPaid": "තවම ගෙවීමක් නෑ",
  "account.noPayments": "තවම ගෙවීමක් නෑ.",
  "account.receipt": "රිසිට්පත",
  "account.waitingApproval": "අනුමැතිය බලාපොරොත්තුවෙන්",
  "account.refunded": "මුදල් ආපසු දී ඇත",
  "account.parentView": "දෙමාපිය බැලීම",
  "account.parentHint": "ඔබේ ප්‍රගතිය දෙමාපියන්ට බලන්න දෙන්න",
  "account.devices": "උපාංග",
  "account.devicesBody":
    "ඔබේ ගිණුම උපාංග {max} ක වැඩ කරයි. ඉවර වුණොත්, අලුත් එකකින් log වුණාම පරණම එක අයින් කරන්න පුළුවන්.",
  "account.noDevices": "තවම උපාංගයක් නෑ.",
  "account.lastUsed": "අන්තිමට {date}",
  "account.details": "විස්තර",
  "account.school": "පාසල",
  "account.district": "දිස්ත්‍රික්කය",
  "account.language": "භාෂාව",
  "account.languageHint": "බොත්තම් සහ මෙනු සඳහා භාෂාව තෝරන්න.",

  "common.loading": "පූරණය වෙමින්…",
  "common.back": "ආපසු",
};

export const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { en, si };

/** Replaces `{name}`-style placeholders. Missing values are left visible, not blanked. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "si";
}
