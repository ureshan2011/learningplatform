import { Card } from "@/components/ds";

/**
 * Questions and answers, all open. The visible twin of `faqJsonLd` — Google
 * accepts FAQ markup only for questions a reader can actually see, so a page
 * that ships the schema renders the same list with this.
 *
 * Open rather than folded: these pages are read on a phone from a search
 * result, and the answer is the thing the visitor came for.
 */
export function FaqList({
  faqs,
  heading,
}: {
  faqs: ReadonlyArray<{ q: string; a: string }>;
  heading: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-extrabold text-ict-fg">{heading}</h2>
      <div className="mt-4 space-y-3">
        {faqs.map((f) => (
          <Card key={f.q} radius="card" className="p-5">
            <h3 className="font-display text-base font-bold text-ict-fg">{f.q}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ict-fg-soft">{f.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
