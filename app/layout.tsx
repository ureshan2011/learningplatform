import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { fontVariables } from "@/lib/fonts";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { SessionKeeper } from "@/components/auth/SessionKeeper";
import { JsonLd } from "@/components/seo/JsonLd";
import { graphJsonLd, organizationJsonLd, personJsonLd, webSiteJsonLd } from "@/lib/seo/json-ld";
import { publicEnv } from "@/lib/env";
import "./globals.css";

/**
 * Site-wide structured data, on every page.
 *
 * Three entities shipped as one `@graph` so their `@id` cross-references
 * resolve: the business, the site, and the teacher. This is what lets Google
 * (and an AI assistant reading the page) resolve "ICT Campus" to a real
 * teaching business rather than a page title — who runs it, what they are
 * qualified in, what it teaches, and to whom.
 *
 * The teacher node matters as much as the organisation one: for an exam
 * preparation site, "who is teaching this and are they qualified" is the first
 * question a search quality rater is instructed to ask, and the answer has to
 * be machine-readable, not just written in the hero.
 */
const SITE_JSON_LD = graphJsonLd([organizationJsonLd(), webSiteJsonLd(), personJsonLd()]);

// The three ICTCAMPUS faces, self-hosted by Next at build time (no runtime
// request to Google). Loaded once here so the display face reaches every page
// rather than only the two marketing pages that used to instantiate it — see
// lib/fonts.ts.

const SITE_DESCRIPTION =
  "A/L ICT classes, past papers and free notes for Sri Lankan Grade 12 & 13 students, in Sinhala and English medium. Live online classes following the full NIE syllabus, instant quizzes and downloadable notes — taught by Dr. Yasas Sri Wickramasinghe, PhD. Free 7-day trial.";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: {
    // The default has to earn a click on its own for any page that doesn't set
    // its own title, so it leads with the subject and the words students
    // actually type — "class", "Sinhala", "English" — not the brand.
    default: "A/L ICT Classes & Past Papers, Sinhala & English — ICT Campus Sri Lanka",
    template: "%s | ICT Campus",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: "ICT Campus",
  appleWebApp: { capable: true, title: "ICT Campus", statusBarStyle: "default" },
  alternates: { canonical: "/" },
  // Sinhala first: it is the medium of instruction and the language most of
  // this audience searches in, even though the interface itself is English.
  other: { "content-language": "si, en" },
  category: "education",
  openGraph: {
    type: "website",
    siteName: "ICT Campus",
    locale: "si_LK",
    alternateLocale: ["en_LK"],
    title: "A/L ICT Classes & Past Papers, Sinhala & English — ICT Campus Sri Lanka",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "A/L ICT Classes & Past Papers, Sinhala & English — ICT Campus Sri Lanka",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    // Without these, Google truncates the snippet and suppresses the preview
    // thumbnail on a site it doesn't know yet — both cost click-through on
    // exactly the informational queries this site is trying to win.
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#fafbf9",
  width: "device-width",
  initialScale: 1,
  // Students pinch-zoom diagrams and code on small screens. Never lock this.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <JsonLd data={SITE_JSON_LD} />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {/*
          Renders nothing. It keeps the session cookie renewed from the
          browser's Firebase refresh token, which is what stops students being
          sent back to the SMS gate on a fixed clock. It has to be here, in the
          root layout, rather than inside the signed-in area: the renewal that
          matters most happens on a public page a student opened from a
          WhatsApp link.
        */}
        <SessionKeeper />
        {children}
      </body>
    </html>
  );
}
