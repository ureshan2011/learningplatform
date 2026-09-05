import { DM_Sans, JetBrains_Mono, Manrope } from "next/font/google";

/**
 * The three ICTCAMPUS faces, loaded once for the whole site.
 *
 * They were previously instantiated inside the two marketing pages that used
 * them, which meant every other page — including the entire signed-in app —
 * fell back to the system stack and quietly lost the brand's typography. One
 * module, imported by the root layout, puts them everywhere and lets Next
 * dedupe and self-host a single copy at build time.
 *
 * Manrope carries display and headings, DM Sans the body and UI, JetBrains
 * Mono anything technical — module codes, receipt numbers, IDs.
 *
 * Each exposes a `--font-*-face` variable; globals.css composes those into the
 * `--font-display` / `--font-body` / `--font-mono` stacks with their fallbacks.
 * `Noto Sans Sinhala` is appended to the body stack there rather than here: the
 * interface is English but the content is Sinhala medium, and a missing Sinhala
 * fallback is the difference between a lesson title and a row of empty boxes.
 */
export const displayFont = Manrope({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display-face",
  display: "swap",
});

export const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body-face",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-face",
  display: "swap",
});

/** Every font variable, for the `<html>` element. */
export const fontVariables = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
