import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
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

// Self-hosted by Next at build time (no runtime request to Google). Loaded
// once here and applied to <body> so every page — not just the landing
// page — can use it for headings, keeping one consistent typographic voice.
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

const SITE_DESCRIPTION =
  "A/L ICT classes, past papers and free notes for Sri Lankan Grade 12 & 13 students, Sinhala medium. Live online classes following the full NIE syllabus, instant quizzes and downloadable notes — taught by Dr. Yasas Sri Wickramasinghe, PhD. Free 7-day trial.";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: {
    // The default has to earn a click on its own for any page that doesn't set
    // its own title, so it leads with the subject and the two words students
    // actually type — "class" and "Sinhala medium" — not the brand.
    default: "A/L ICT Classes & Past Papers, Sinhala Medium — ICT Campus Sri Lanka",
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
    title: "A/L ICT Classes & Past Papers, Sinhala Medium — ICT Campus Sri Lanka",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "A/L ICT Classes & Past Papers, Sinhala Medium — ICT Campus Sri Lanka",
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
    <html lang="en" className={display.variable}>
      {/*
        Icon font for the whole app — see the .material-symbols-outlined rule
        in globals.css. `display=block` (not `swap`) is Google's own
        recommendation for icon fonts: an icon rendering as its literal glyph
        name for a moment is worse than a brief blank space. The two ESLint
        rules below are pages-router-era checks that don't apply to a root
        layout in the App Router, where this is the correct way to add a link
        tag that isn't covered by next/font.
      */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
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
