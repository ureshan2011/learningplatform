import type { ActivityEvent } from "@/lib/types";
import type { IconName } from "@/components/ui/Icon";

/**
 * Turns a recorded event into something a teacher can read at a glance.
 *
 * The log is only worth having if it reads like sentences. A screen of
 * `/subjects/al-ict/mock-exams/me_1731...` tells the owner nothing about
 * whether a student is working; "Mock exams" does.
 *
 * Matching is ordered and first-wins, so the specific patterns come before the
 * general ones. Anything unmatched falls back to the path itself rather than
 * being hidden — a blank row would make a new route look like no activity.
 */

export type ActivityGroup = "A/L ICT" | "Campus Ready" | "Survival Pack" | "Account" | "Other";

export interface DescribedEvent {
  label: string;
  group: ActivityGroup;
  icon: IconName;
}

interface Rule {
  /** Matched against the path with dynamic segments already in place. */
  test: RegExp;
  label: string | ((m: RegExpMatchArray) => string);
  group: ActivityGroup;
  icon: IconName;
}

const RULES: Rule[] = [
  // ---- Survival Pack -----------------------------------------------------
  {
    test: /^\/packs\/[^/]+\/([^/]+)$/,
    label: (m) => `Read the guide: ${guideName(m[1])}`,
    group: "Survival Pack",
    icon: "auto_stories",
  },
  { test: /^\/packs\/[^/]+$/, label: "Opened the pack", group: "Survival Pack", icon: "inventory_2" },
  {
    test: /^\/campus-survival-pack$/,
    label: "Looked at the pack sales page",
    group: "Survival Pack",
    icon: "storefront",
  },
  {
    test: /^\/campus\/academic-email$/,
    label: "Read the free email samples",
    group: "Survival Pack",
    icon: "mail",
  },

  // ---- Campus Ready ------------------------------------------------------
  { test: /^\/campus\/[^/]+$/, label: "Opened Campus Ready", group: "Campus Ready", icon: "school" },
  {
    test: /^\/campus-ready$/,
    label: "Looked at the Campus Ready page",
    group: "Campus Ready",
    icon: "storefront",
  },

  // ---- A/L ICT -----------------------------------------------------------
  { test: /^\/subjects\/[^/]+\/practice$/, label: "Practice", group: "A/L ICT", icon: "quiz" },
  {
    test: /^\/subjects\/[^/]+\/mock-exams\/[^/]+$/,
    label: "Sat a mock exam",
    group: "A/L ICT",
    icon: "schedule",
  },
  { test: /^\/subjects\/[^/]+\/mock-exams$/, label: "Mock exams", group: "A/L ICT", icon: "schedule" },
  { test: /^\/subjects\/[^/]+\/lab$/, label: "Code Lab", group: "A/L ICT", icon: "code" },
  {
    test: /^\/subjects\/[^/]+\/predicted-paper$/,
    label: "Predicted paper",
    group: "A/L ICT",
    icon: "fact_check",
  },
  {
    test: /^\/subjects\/[^/]+\/certificate$/,
    label: "Certificate",
    group: "A/L ICT",
    icon: "military_tech",
  },
  {
    test: /^\/subjects\/[^/]+$/,
    label: "Notes and past papers",
    group: "A/L ICT",
    icon: "description",
  },
  {
    test: /^\/syllabus\/[^/]+\/([^/]+)$/,
    label: (m) => `Syllabus: ${m[1].replace(/-/g, " ")}`,
    group: "A/L ICT",
    icon: "auto_stories",
  },
  { test: /^\/syllabus(\/.*)?$/, label: "Syllabus", group: "A/L ICT", icon: "auto_stories" },
  { test: /^\/live\/[^/]+$/, label: "Joined a live class", group: "A/L ICT", icon: "live_tv" },

  // ---- Account and money -------------------------------------------------
  { test: /^\/dashboard$/, label: "Dashboard", group: "Account", icon: "home" },
  { test: /^\/account$/, label: "Account and billing", group: "Account", icon: "account_circle" },
  { test: /^\/pay\/slip$/, label: "Started a bank deposit", group: "Account", icon: "account_balance" },
  { test: /^\/payments\/success$/, label: "Finished a payment", group: "Account", icon: "payments" },
  { test: /^\/signin$/, label: "Sign-in page", group: "Account", icon: "lock" },

  // ---- Free resources ----------------------------------------------------
  { test: /^\/notes$/, label: "Free notes", group: "Other", icon: "description" },
  { test: /^\/past-papers$/, label: "Past papers", group: "Other", icon: "receipt_long" },
  { test: /^\/command-words$/, label: "Command words", group: "Other", icon: "fact_check" },
  { test: /^\/$/, label: "Home page", group: "Other", icon: "home" },
];

const GUIDE_NAMES: Record<string, string> = {
  "apa-harvard": "APA 7 and Harvard",
  "first-week": "First week on campus",
  "academic-email": "Academic email templates",
  "ai-rules": "Using AI honestly",
};

function guideName(key: string): string {
  return GUIDE_NAMES[key] ?? key.replace(/-/g, " ");
}

export function describeEvent(event: ActivityEvent): DescribedEvent {
  if (event.kind === "download") {
    return {
      label: `Downloaded ${event.label ?? "a file"}`,
      group: groupForPath(event.path),
      icon: "download",
    };
  }

  if (event.kind === "signin") {
    return { label: "Signed in", group: "Account", icon: "lock_open" };
  }

  for (const rule of RULES) {
    const match = event.path.match(rule.test);
    if (!match) continue;
    return {
      label: typeof rule.label === "function" ? rule.label(match) : rule.label,
      group: rule.group,
      icon: rule.icon,
    };
  }

  // Unmatched rather than unknown: showing the raw path is how a route nobody
  // wrote a rule for still appears, instead of vanishing from the record.
  return { label: event.path, group: groupForPath(event.path), icon: "link" };
}

function groupForPath(path: string): ActivityGroup {
  if (path.startsWith("/packs/") || path.startsWith("/campus-survival-pack")) return "Survival Pack";
  if (path.startsWith("/campus")) return "Campus Ready";
  if (path.startsWith("/subjects/") || path.startsWith("/syllabus")) return "A/L ICT";
  if (path.startsWith("/account") || path.startsWith("/pay")) return "Account";
  return "Other";
}
