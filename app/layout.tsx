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
    default: "ICT Class — O/L & A/L ICT Tuition, Sri Lanka",
    template: "%s | ICT Class",
  },
  description:
    "Live interactive O/L and A/L ICT tuition in Sinhala medium. Live classes, instant quizzes, past papers and a 24/7 doubt assistant.",
  manifest: "/manifest.webmanifest",
  applicationName: "ICT Class",
  appleWebApp: { capable: true, title: "ICT Class", statusBarStyle: "default" },
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
      <body>{children}</body>
    </html>
  );
}
