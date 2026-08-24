import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ICT Class — O/L & A/L ICT Tuition, Sri Lanka",
    template: "%s | ICT Class",
  },
  description:
    "Live interactive O/L and A/L ICT tuition in Sinhala medium. Live classes, instant quizzes, past papers and a 24/7 doubt assistant.",
  manifest: "/manifest.webmanifest",
  applicationName: "ICT Class",
  appleWebApp: { capable: true, title: "ICT Class", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1,
  // Students pinch-zoom diagrams and code on small screens. Never lock this.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
