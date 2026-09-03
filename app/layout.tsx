import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { publicEnv } from "@/lib/env";
import "./globals.css";

/**
 * Organization structured data, on every page. This is what lets Google (and
 * an AI assistant reading the page) resolve "ICT Campus" to a real teaching
 * business rather than just a page title — who runs it, how to reach them,
 * what it teaches. Static and small enough to inline rather than fetch.
 */
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "ICT Campus",
  url: publicEnv.appUrl,
  logo: `${publicEnv.appUrl}/logo.png`,
  description:
    "Live interactive A/L ICT tuition (Grades 12 & 13) for Sri Lankan students, Sinhala medium, plus free notes, past papers and video breakdowns.",
  founder: {
    "@type": "Person",
    name: "Dr. Yasas Sri Wickramasinghe",
    sameAs: ["https://www.linkedin.com/in/yasassri"],
  },
  areaServed: {
    "@type": "Country",
    name: "Sri Lanka",
  },
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
  },
};

// Self-hosted by Next at build time (no runtime request to Google). Loaded
// once here and applied to <body> so every page — not just the landing
// page — can use it for headings, keeping one consistent typographic voice.
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: {
    default: "ICT Campus — A/L ICT Tuition, Sri Lanka",
    template: "%s | ICT Campus",
  },
  description:
    "Live interactive A/L ICT tuition (Grades 12 & 13) in Sinhala medium. Live classes, instant quizzes, past papers and a 24/7 doubt assistant.",
  manifest: "/manifest.webmanifest",
  applicationName: "ICT Campus",
  appleWebApp: { capable: true, title: "ICT Campus", statusBarStyle: "default" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ICT Campus",
    locale: "en_LK",
    title: "ICT Campus — A/L ICT Tuition, Sri Lanka",
    description:
      "Live interactive A/L ICT tuition (Grades 12 & 13) in Sinhala medium. Live classes, instant quizzes, past papers and a 24/7 doubt assistant.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ICT Campus — A/L ICT Tuition, Sri Lanka",
    description:
      "Live interactive A/L ICT tuition (Grades 12 & 13) in Sinhala medium. Live classes, instant quizzes, past papers and a 24/7 doubt assistant.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
