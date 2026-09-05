import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { PlaceValueChart } from "@/components/illustrations/PlaceValueChart";
import { NibbleGrouping } from "@/components/illustrations/NibbleGrouping";
import { BinaryAddition } from "@/components/illustrations/BinaryAddition";
import { TwosComplementFlow } from "@/components/illustrations/TwosComplementFlow";
import { BASES, FAQ, PRACTICE } from "@/lib/content/number-systems";

export const metadata: Metadata = {
  title: "Number systems for A/L ICT — binary, hex & two's complement",
  description:
    "Binary, octal, decimal and hexadecimal conversions for A/L ICT, worked step by step with diagrams — decimal to binary, binary to hex, two's complement for negative numbers, and binary addition. Free.",
  alternates: { canonical: "/number-systems" },
};

// Fixed reference content — safe to cache like command-words and distinguish-between.
export const revalidate = 86400;

/** Repeated division-by-base, the standard decimal→base conversion method — reading the remainders bottom to top gives the answer. */
function divisionSteps(value: number, base: number) {
  const steps: { dividend: number; quotient: number; remainder: number }[] = [];
  let n = value;
  while (n > 0) {
    steps.push({ dividend: n, quotient: Math.floor(n / base), remainder: n % base });
    n = Math.floor(n / base);
  }
  return steps;
}

export default function NumberSystemsPage() {
  const steps = divisionSteps(156, 2);
  const binaryOf156 = steps
    .map((s) => s.remainder)
    .reverse()
    .join("");
  const bitsOf45 = (45).toString(2).padStart(8, "0");

  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Number systems", path: "/number-systems" },
        ])}
      />
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold">
          <Icon name="memory" className="!text-2xl text-(--color-awaken-accent)" />
          Number systems — binary, hex and two&apos;s complement
        </h1>
        <p className="mt-3 text-(--color-awaken-ink-soft)">
          A fixed MCQ topic every year, and a common short-structured question in Paper II. Every
          conversion below follows a mechanical method — get the method right once and any number
          in the question works the same way.
        </p>
        <p className="si mt-2 text-sm text-(--color-awaken-deep)" lang="si">
          දශමය, ද්විමය සහ hexadecimal අතර පරිවර්තනය කරන ආකාරය මෙතන සරලව පැහැදිලි කර ඇත.
        </p>
        <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
          Need logic gates next?{" "}
          <Link href="/logic-gates" className="text-(--color-awaken-accent) underline">
            Symbols and truth tables, all seven gates
          </Link>
          .
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">The four number systems</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--color-awaken-line) text-left text-xs text-(--color-awaken-ink-soft) uppercase">
                  <th className="py-2 pr-4">System</th>
                  <th className="py-2 pr-4">Base</th>
                  <th className="py-2 pr-4">Digits used</th>
                  <th className="py-2">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {BASES.map((b) => (
                  <tr key={b.name} className="border-b border-(--color-awaken-line) last:border-0">
                    <td className="py-2 pr-4 font-semibold">{b.name}</td>
                    <td className="py-2 pr-4 font-mono">{b.base}</td>
                    <td className="py-2 pr-4 font-mono">{b.digits}</td>
                    <td className="py-2 text-(--color-awaken-ink-soft)">{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Decimal → binary: divide by 2, read the remainders</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            Divide by 2 repeatedly until the quotient reaches 0, then read the remainders from the
            bottom of the list back up to the top.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--color-awaken-line) text-left text-xs text-(--color-awaken-ink-soft) uppercase">
                  <th className="py-1.5 pr-4">Divide</th>
                  <th className="py-1.5 pr-4">Quotient</th>
                  <th className="py-1.5">Remainder</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s, i) => (
                  <tr key={i} className="border-b border-(--color-awaken-line) last:border-0">
                    <td className="py-1.5 pr-4 font-mono">{s.dividend} ÷ 2</td>
                    <td className="py-1.5 pr-4 font-mono">{s.quotient}</td>
                    <td className="py-1.5 font-mono font-bold text-(--color-awaken-accent)">{s.remainder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
            Reading remainders bottom to top: <span className="font-mono font-semibold">{binaryOf156}</span>. Check
            it the other way — add up the place values of every 1 bit:
          </p>
          <div className="mt-4">
            <PlaceValueChart bits={binaryOf156} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Binary → hexadecimal: group into nibbles of 4</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            Split the binary number into groups of 4 bits (nibbles) starting from the right, then
            convert each nibble to its single hex digit.
          </p>
          <div className="mt-4">
            <NibbleGrouping bits={binaryOf156} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Two&apos;s complement: how negative numbers are stored</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            To store −45 in 8-bit two&apos;s complement: write 45 in 8-bit binary, invert every bit,
            then add 1.
          </p>
          <div className="mt-4">
            <TwosComplementFlow bits={bitsOf45} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Binary addition, with the carry shown</h2>
          <p className="mt-2 text-(--color-awaken-ink-soft)">
            Add column by column from the right, just like decimal addition — except a bit can only
            hold 0 or 1, so a carry into the next column happens as soon as the total reaches 2.
          </p>
          <div className="mt-4">
            <BinaryAddition a="1011" b="0110" />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Practice questions</h2>
          <ul className="mt-4 space-y-3">
            {PRACTICE.map((p) => (
              <li key={p.q} className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
                <p className="font-semibold">{p.q}</p>
                <p className="mt-2 flex items-start gap-2 text-sm text-(--color-awaken-ink-soft)">
                  <Icon name="check_circle" className="mt-0.5 shrink-0 !text-base text-(--color-awaken-success)" />
                  {p.a}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Questions students ask</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((faq) => (
              <details
                key={faq.q}
                className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card)"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold">{faq.q}</summary>
                <p className="border-t border-(--color-awaken-line) px-5 py-4 text-sm text-(--color-awaken-ink-soft)">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
          <h2 className="text-lg font-bold">Get every conversion drilled until it&apos;s automatic</h2>
          <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
            Every subject&apos;s Practice section includes number-system conversion questions with
            instant marking, plus the full data representation unit taught live.
          </p>
          <Link
            href="/signin"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-5 py-2.5 font-semibold text-white"
          >
            <Icon name="videocam" className="!text-base" />
            Join a class
          </Link>
        </section>
      </main>
    </>
  );
}
