import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Self-hosted by Next at build time (no runtime request to Google). Loaded
// once here and applied to <body> so every page — not just the landing
// page — can use it for headings, keeping one consistent typographic voice.
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "ICT Campus — O/L & A/L ICT Tuition, Sri Lanka",
    template: "%s | ICT Campus",
  },
  description:
    "Live interactive O/L and A/L ICT tuition in Sinhala medium. Live classes, instant quizzes, past papers and a 24/7 doubt assistant.",
  manifest: "/manifest.webmanifest",
  applicationName: "ICT Campus",
  appleWebApp: { capable: true, title: "ICT Campus", statusBarStyle: "default" },
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
      <body>{children}</body>
    </html>
  );
}
