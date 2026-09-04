import { publicEnv } from "@/lib/env";
import {
  COUNTRY,
  GRADES,
  MEDIUM_EN,
  SUBJECT_EN,
  SUBJECT_EN_LONG,
  SYLLABUS_AUTHORITY,
  TEACHER_CREDENTIALS,
  TEACHER_LINKEDIN,
  TEACHER_NAME,
} from "@/lib/seo/site";

/**
 * Structured data builders.
 *
 * Two audiences read this and neither reads the page's prose: Google, which
 * uses it to decide whether a result is eligible for a rich snippet, and an AI
 * assistant, which uses it to answer "what does this site actually offer"
 * without having to infer it from marketing copy. Both are strict about types,
 * so every builder returns a shape that validates rather than something
 * approximate.
 *
 * Everything is keyed by a stable `@id` so the graph on one page refers to the
 * same organisation and the same teacher as the graph on every other page,
 * instead of Google seeing a new business per URL.
 */

const base = () => publicEnv.appUrl;

/** Stable node ids. Reused across pages so the entities merge rather than multiply. */
export const ORG_ID = () => `${base()}/#organization`;
export const SITE_ID = () => `${base()}/#website`;
export const TEACHER_ID = () => `${base()}/#teacher`;

/**
 * The teacher, as a citable entity. This is the site's E-E-A-T signal: for an
 * exam-preparation site, "who is teaching this and what are they qualified in"
 * is the question a search quality rater is told to ask first.
 */
export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": TEACHER_ID(),
    name: TEACHER_NAME,
    url: base(),
    jobTitle: "Senior Lecturer",
    description: `${TEACHER_NAME} teaches ${SUBJECT_EN} (${GRADES}, ${MEDIUM_EN}) to Sri Lankan students. ${TEACHER_CREDENTIALS.join(". ")}.`,
    knowsAbout: [
      SUBJECT_EN_LONG,
      "Computer science education",
      "Python programming",
      "Database management and SQL",
      "Computer networking",
      "Digital logic and Boolean algebra",
      "Web development",
      "Human interface technology",
    ],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "University of Canterbury",
      address: { "@type": "PostalAddress", addressCountry: "NZ" },
    },
    sameAs: [TEACHER_LINKEDIN],
    worksFor: { "@id": ORG_ID() },
  };
}

/** The teaching business itself — who runs it, where, for whom. */
export function organizationJsonLd() {
  return {
    "@type": "EducationalOrganization",
    "@id": ORG_ID(),
    name: "ICT Campus",
    alternateName: ["ICTCampus", "ICT Campus Sri Lanka", "ictcampus.lk"],
    url: base(),
    logo: { "@type": "ImageObject", url: `${base()}/logo.png` },
    image: `${base()}/logo.png`,
    description: `Online ${SUBJECT_EN} tuition for Sri Lankan students (${GRADES}, ${MEDIUM_EN}) following the ${SYLLABUS_AUTHORITY} syllabus — live interactive classes, plus free notes, past paper breakdowns and revision material.`,
    founder: { "@id": TEACHER_ID() },
    employee: { "@id": TEACHER_ID() },
    areaServed: { "@type": "Country", name: COUNTRY },
    knowsLanguage: ["si", "en"],
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: `Sri Lankan GCE Advanced Level students (${GRADES})`,
    },
  };
}

/**
 * The site as a searchable thing. `SearchAction` is what can earn a sitelinks
 * search box, and `inLanguage` tells Google this content serves both a Sinhala
 * and an English audience — the two mediums students choose between.
 */
export function webSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID(),
    url: base(),
    name: "ICT Campus",
    description: `Free ${SUBJECT_EN} notes, past papers and syllabus breakdowns, plus live online classes, for Sri Lankan ${GRADES} students in ${MEDIUM_EN}.`,
    publisher: { "@id": ORG_ID() },
    inLanguage: ["si", "en"],
  };
}

/**
 * The trail from the home page to here. Google renders this in place of a raw
 * URL in the result, which measurably lifts click-through on deep pages — and
 * it is the cheapest way to tell a crawler how the site is organised.
 */
export function breadcrumbJsonLd(trail: ReadonlyArray<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: `${base()}${step.path}`,
    })),
  };
}

/** Same questions as the visible accordion — this is only what makes them snippet-eligible. */
export function faqJsonLd(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export interface CourseOffering {
  /** The subject's own name, e.g. "A/L ICT — Grade 13". */
  name: string;
  description: string;
  /** Monthly fee in LKR rupees. Omitted entirely when no subject is published yet. */
  priceLKR?: number;
  path: string;
}

/**
 * The class as a `Course`, which is the type Google's education rich results
 * are built on, and the one an AI assistant looks for when asked what a
 * tuition site teaches, in what language, at what price.
 *
 * `hasCourseInstance` is required for a course to be eligible — a course with
 * no instance reads to Google as a syllabus description rather than something
 * a student can actually enrol in.
 */
export function courseJsonLd(course: CourseOffering) {
  return {
    "@type": "Course",
    "@id": `${base()}${course.path}#course`,
    name: course.name,
    description: course.description,
    url: `${base()}${course.path}`,
    provider: { "@id": ORG_ID() },
    educationalLevel: "GCE Advanced Level",
    teaches: SUBJECT_EN_LONG,
    inLanguage: ["si", "en"],
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: `Sri Lankan Advanced Level students, ${GRADES}`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "P4H",
      inLanguage: "si",
      location: { "@type": "VirtualLocation", url: `${base()}${course.path}` },
      instructor: { "@id": TEACHER_ID() },
    },
    ...(course.priceLKR
      ? {
          offers: {
            "@type": "Offer",
            category: "Subscription",
            price: String(course.priceLKR),
            priceCurrency: "LKR",
            availability: "https://schema.org/InStock",
            url: `${base()}${course.path}`,
            // The trial is the offer's most persuasive term and belongs in the
            // structured data, not only in the marketing copy above it.
            eligibleCustomerType: "https://schema.org/Student",
          },
        }
      : { isAccessibleForFree: false }),
  };
}

/**
 * Wraps a set of nodes in a single `@graph`. One script tag per page holding
 * one graph beats several disconnected scripts: the `@id` references above
 * only resolve into one coherent picture when the nodes ship together.
 */
export function graphJsonLd(nodes: ReadonlyArray<object>) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** Serialises for `dangerouslySetInnerHTML`, escaping the one sequence that could break out of the script tag. */
export function jsonLdHtml(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
