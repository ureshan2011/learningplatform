/**
 * A/L ICT number systems reference — binary, hexadecimal, octal and decimal,
 * plus two's complement and binary addition. Static, stable computer-science
 * fact rather than syllabus-version-dependent content, same reasoning as
 * distinguish-between.ts: safe to publish once and never goes stale.
 *
 * The worked examples here (156, 9C, -45, 1011+0110) are the same numbers the
 * illustration components on the page recompute from scratch — so the
 * diagram and the stated answer are two views of one number, not two
 * separately-authored facts that could quietly drift apart.
 */
export const BASES = [
  { name: "Binary", base: 2, digits: "0, 1", note: "What the computer actually stores and processes." },
  { name: "Octal", base: 8, digits: "0–7", note: "Rarely used directly in the A/L syllabus, but a valid base to know." },
  { name: "Decimal", base: 10, digits: "0–9", note: "The number system people think in." },
  { name: "Hexadecimal", base: 16, digits: "0–9, A–F", note: "A compact way to write binary — every hex digit is exactly 4 bits." },
] as const;

export const FAQ = [
  {
    q: "Why does A/L ICT use hexadecimal at all, if computers only use binary?",
    a: "Because binary is unreadable at any real length — an 8-bit byte is 8 characters, a 32-bit address is 32. Hexadecimal groups binary into 4-bit nibbles, so the same 8-bit value becomes just 2 hex digits, and converting between them is a mechanical grouping exercise rather than arithmetic.",
  },
  {
    q: "What is the quickest way to convert decimal to binary?",
    a: "Divide repeatedly by 2, writing down the remainder each time, until the quotient reaches 0 — then read the remainders from bottom to top. The alternative, subtracting powers of 2 from largest to smallest, works just as well and is often faster to do in your head for exam-sized numbers.",
  },
  {
    q: "What is two's complement and why is it used?",
    a: "It's the standard way computers represent negative numbers in binary: invert every bit of the positive value, then add 1. It's used because it lets addition and subtraction use the exact same binary-adder circuit for both positive and negative numbers — no separate \"subtract\" hardware is needed.",
  },
  {
    q: "How do I know how many bits a two's complement answer needs?",
    a: "The question will state it (commonly 8 bits at A/L). Pad the original positive value with leading zeros to that width before you invert — skipping this is the most common mark-losing mistake in two's complement questions.",
  },
] as const;

export interface NumberSystemsPractice {
  q: string;
  a: string;
}

export const PRACTICE: NumberSystemsPractice[] = [
  {
    q: "Convert 156 (decimal) to binary.",
    a: "10011100 — divide 156 by 2 repeatedly and read the remainders bottom to top: 156→78 r0, 78→39 r0, 39→19 r1, 19→9 r1, 9→4 r1, 4→2 r0, 2→1 r0, 1→0 r1.",
  },
  {
    q: "Convert 10011100 (binary) to hexadecimal.",
    a: "9C — group into 4-bit nibbles from the right: 1001 (=9) and 1100 (=C).",
  },
  {
    q: "Represent −45 in 8-bit two's complement.",
    a: "11010011 — write 45 as 00101101, invert every bit to get 11010010, then add 1.",
  },
  {
    q: "Add the 4-bit binary numbers 1011 and 0110.",
    a: "10001 (17 in decimal) — the addition carries out of the top bit, so the 4-bit result needs a 5th bit to hold it.",
  },
] as const;
