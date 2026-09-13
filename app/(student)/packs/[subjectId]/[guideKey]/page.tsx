import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getProduct } from "@/lib/queries";
import { hasAccess } from "@/lib/payments/entitlements";
import { getT, getLocale, localeAttrs } from "@/lib/i18n/server";
import { AI_NOTE, PACK_GUIDES, pick } from "@/lib/content/survival-pack";
import { CopyButton } from "@/components/packs/CopyButton";
import { AiDeclarationGenerator } from "@/components/packs/AiDeclarationGenerator";
import { Card, PageHeader, SectionHeading } from "@/components/ds";

/**
 * One guide from the pack.
 *
 * A student without access is sent back to the pack page rather than shown a
 * 403: they are one payment away from the thing they just tapped, and the pack
 * page is where that happens.
 */
export default async function PackGuidePage({
  params,
}: {
  params: Promise<{ subjectId: string; guideKey: string }>;
}) {
  const { subjectId, guideKey } = await params;
  const user = await requirePageUser(`/packs/${subjectId}/${guideKey}`);

  const [subject, guide] = await Promise.all([
    getProduct(subjectId),
    Promise.resolve(PACK_GUIDES.find((g) => g.key === guideKey)),
  ]);
  if (!subject?.product || !guide) notFound();

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) redirect(`/packs/${subjectId}`);

  const [t, loc, locale] = await Promise.all([getT(), localeAttrs(), getLocale()]);

  return (
    <main lang={loc.lang} className={loc.className}>
      <PageHeader eyebrow={subject.name} title={pick(guide.title, locale)} />

      <div className="mt-5 max-w-3xl space-y-3">
        {guide.sections.map((section, i) => (
          <Card key={i} radius="card" className="p-5">
            <SectionHeading as="h2" className="!text-lg">
              {pick(section.heading, locale)}
            </SectionHeading>
            <p className="mt-2.5 text-sm leading-relaxed text-ict-ink-200">
              {pick(section.body, locale)}
            </p>

            {section.templates ? (
              <div className="mt-4 space-y-3">
                {section.templates.map((template, j) => (
                  <div
                    key={j}
                    className="rounded-ict-md border border-ict-border-dark bg-ict-ink-800 p-4"
                  >
                    <p className="text-xs font-semibold text-ict-ink-400">
                      {pick(template.label, locale)}
                    </p>
                    {/* `whitespace-pre-wrap` keeps the blank lines that make an
                        email an email; `break-words` stops a long DOI pushing
                        the card off a 360px screen. */}
                    <p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ict-paper-50">
                      {template.text}
                    </p>
                    <div className="mt-3">
                      <CopyButton
                        text={template.text}
                        label={t("pack.copy")}
                        copiedLabel={t("pack.copied")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ))}

        {guide.key === "ai-rules" ? (
          <AiDeclarationGenerator
            copy={{
              heading: t("pack.declareHeading"),
              toolLabel: t("pack.declareTool"),
              toolPlaceholder: t("pack.declareToolPlaceholder"),
              usesLabel: t("pack.declareUses"),
              uses: [
                { key: "brainstorming", label: t("pack.useBrainstorming") },
                { key: "grammar", label: t("pack.useGrammar") },
                { key: "summarising", label: t("pack.useSummarising") },
                { key: "code", label: t("pack.useCode") },
                { key: "translation", label: t("pack.useTranslation") },
              ],
              outputLabel: t("pack.declareOutput"),
              emptyHint: t("pack.declareEmpty"),
              copyLabel: t("pack.copy"),
              copiedLabel: t("pack.copied"),
            }}
          />
        ) : null}

        <p className="pt-2 text-xs text-ict-ink-400">{pick(AI_NOTE, locale)}</p>
      </div>
    </main>
  );
}
