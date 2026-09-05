import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";
import { GateSymbol } from "@/components/illustrations/GateSymbol";
import { FreeResourcesFooter } from "@/components/content/FreeResourcesFooter";
import { GATES, FAQ, evalGate } from "@/lib/content/logic-gates";

export const metadata: Metadata = {
  title: "Logic gates for A/L ICT — symbols, truth tables & Boolean expressions",
  description:
    "All seven A/L ICT logic gates — AND, OR, NOT, NAND, NOR, XOR, XNOR — with a labelled symbol, Boolean expression and computed truth table for each, plus De Morgan's theorem proved step by step. Free.",
  alternates: { canonical: "/logic-gates" },
};

// Fixed reference content — safe to cache like command-words and distinguish-between.
export const revalidate = 86400;

function truthRows(double: boolean) {
  if (!double) return [{ a: 0 as const, b: undefined }, { a: 1 as const, b: undefined }];
  return [
    { a: 0 as const, b: 0 as const },
    { a: 0 as const, b: 1 as const },
    { a: 1 as const, b: 0 as const },
    { a: 1 as const, b: 1 as const },
  ];
}

export default function LogicGatesPage() {
  // De Morgan's theorem: (A·B)′ = A′+B′, checked row by row rather than asserted.
  const deMorganRows = truthRows(true).map((row) => {
    const a = row.a;
    const b = row.b as 0 | 1;
    const lhs = evalGate("NAND", a, b); // (A·B)′
    const rhs = evalGate("NOT", a, 0) === 1 || evalGate("NOT", b, 0) === 1 ? 1 : 0; // A′+B′
    return { a, b, lhs, rhs, match: lhs === rhs };
  });

  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Logic gates", path: "/logic-gates" },
        ])}
      />
      <SiteHeader user={null} />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="mt-4 flex items-center gap-2 text-3xl font-bold">
          <Icon name="hub" className="!text-2xl text-(--color-awaken-accent)" />
          Logic gates, explained with the actual symbols
        </h1>
        <p className="mt-3 text-(--color-awaken-ink-soft)">
          Paper I asks you to identify a gate from its symbol or complete its truth table. Paper II
          asks you to write or simplify a Boolean expression. Both come from the same seven gates
          below — learn the symbol and the one row that makes each gate distinct from its
          closest lookalike.
        </p>
        <p className="si mt-2 text-sm text-(--color-awaken-deep)" lang="si">
          AND, OR, NOT වගේ logic gates වල truth table සහ symbols මෙතන සරලව පැහැදිලි කර ඇත.
        </p>
        <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
          Converting between number systems first?{" "}
          <Link href="/number-systems" className="text-(--color-awaken-accent) underline">
            Binary, hex and two&apos;s complement, worked step by step
          </Link>
          .
        </p>

        <ul className="mt-10 space-y-6">
          {GATES.map((gate) => (
            <li
              key={gate.type}
              id={gate.type}
              className="scroll-mt-20 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">{gate.type} gate</h2>
                <span className="font-mono text-sm font-semibold text-(--color-awaken-accent)">{gate.expression}</span>
              </div>
              <p className="si mt-1 text-sm text-(--color-awaken-deep)" lang="si">
                {gate.sinhala}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
                <GateSymbol type={gate.type} className="mx-auto w-full max-w-[220px]" />

                <div>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-(--color-awaken-line) text-left text-xs text-(--color-awaken-ink-soft) uppercase">
                        <th className="py-1.5 pr-4">A</th>
                        {gate.double ? <th className="py-1.5 pr-4">B</th> : null}
                        <th className="py-1.5">Q</th>
                      </tr>
                    </thead>
                    <tbody>
                      {truthRows(gate.double).map((row, i) => {
                        const q = evalGate(gate.type, row.a, (row.b ?? 0) as 0 | 1);
                        return (
                          <tr key={i} className="border-b border-(--color-awaken-line) last:border-0">
                            <td className="py-1.5 pr-4 font-mono">{row.a}</td>
                            {gate.double ? <td className="py-1.5 pr-4 font-mono">{row.b}</td> : null}
                            <td
                              className={
                                "py-1.5 font-mono font-bold " +
                                (q === 1 ? "text-(--color-awaken-success)" : "text-(--color-awaken-ink-soft)")
                              }
                            >
                              {q}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-4 text-sm text-(--color-awaken-ink-soft)">{gate.meaning}</p>
              <p className="mt-2 flex items-start gap-2 rounded-lg bg-(--color-awaken-accent-soft) p-3 text-sm text-(--color-awaken-accent)">
                <Icon name="bolt" className="mt-0.5 shrink-0 !text-base" />
                {gate.examNote}
              </p>
            </li>
          ))}
        </ul>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">De Morgan&apos;s theorem, proved rather than stated</h2>
          <p className="mt-3 text-(--color-awaken-ink-soft)">
            (A·B)′ is meant to behave exactly like A′+B′. Instead of taking that on faith, check every
            row of both truth tables side by side:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--color-awaken-line) text-left text-xs text-(--color-awaken-ink-soft) uppercase">
                  <th className="py-1.5 pr-4">A</th>
                  <th className="py-1.5 pr-4">B</th>
                  <th className="py-1.5 pr-4">(A·B)′</th>
                  <th className="py-1.5 pr-4">A′+B′</th>
                  <th className="py-1.5">Match?</th>
                </tr>
              </thead>
              <tbody>
                {deMorganRows.map((row, i) => (
                  <tr key={i} className="border-b border-(--color-awaken-line) last:border-0">
                    <td className="py-1.5 pr-4 font-mono">{row.a}</td>
                    <td className="py-1.5 pr-4 font-mono">{row.b}</td>
                    <td className="py-1.5 pr-4 font-mono">{row.lhs}</td>
                    <td className="py-1.5 pr-4 font-mono">{row.rhs}</td>
                    <td className="py-1.5">
                      <Icon
                        name={row.match ? "check_circle" : "cancel"}
                        className={"!text-base " + (row.match ? "text-(--color-awaken-success)" : "text-(--color-awaken-danger)")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
            Every row matches, so the two expressions are equivalent — which is exactly what an
            exam question asking you to &quot;prove De Morgan&apos;s theorem using a truth table&quot;
            wants to see. The mirror rule, (A+B)′ = A′·B′, is proved the same way.
          </p>
        </section>

        <section className="mt-14">
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

        <FreeResourcesFooter exclude={["/logic-gates"]} />

        <section className="mt-8 rounded-xl border border-(--color-awaken-accent)/30 bg-(--color-awaken-accent-soft) p-6">
          <h2 className="text-lg font-bold">Drill this under real exam pressure</h2>
          <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
            Every subject&apos;s Practice section includes gate-identification and truth-table
            questions with instant marking, plus the full digital circuits unit taught live.
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
